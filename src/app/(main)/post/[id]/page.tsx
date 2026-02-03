'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Eye, MoreHorizontal, Trash2, Edit, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Textarea } from '@/components/ui/textarea';
import { TopicBadge } from '@/components/ui/TopicBadge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Post, Comment } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [commentText, setCommentText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resolveImageSrc = (src: string) => {
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) {
      const apiIndex = src.indexOf('/api/v1/');
      if (apiIndex !== -1) {
        return src.slice(apiIndex);
      }
      return src;
    }
    if (src.startsWith('/api/')) return src;
    if (src.startsWith('/files/')) return `${API_BASE_URL}${src}`;
    if (src.startsWith('files/')) return `${API_BASE_URL}/${src}`;
    return src;
  };

  // Fetch Post
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res: any = await api.get(`/posts/${id}`);
      // Map API response to Post interface
      return {
        id: res.postId,
        topic: res.topic,
        title: res.title,
        content: res.content,
        preview: '',
        author: {
          id: res.writerId,
          name: res.writerName,
          trackName: res.trackName,
          profileImageUrl: res.profileImageUrl,
        },
        reactionCount: res.reactions?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0,
        commentCount: res.commentsCount,
        viewCount: 0,
        isReacted: res.reactions?.some((r: any) => r.reactedByMe) || false,
        isAuthor: false, // Need to check against current user or API should return it? API doesn't seem to return isAuthor explicitly, might need to compare with user ID from auth context.
        createdAt: res.wroteAt,
        updatedAt: res.wroteAt,
        highlightType: res.highlightType,
      } as Post;
    },
    enabled: !!id,
  });

  // Fetch Comments
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const res: any = await api.get(`/comments/${id}`);
      // Recursive mapping function if needed, but for now map top level
      const mapComment = (c: any): Comment => ({
        id: c.commentId,
        content: c.content,
        author: {
          id: c.author.userId,
          name: c.author.name,
          profileImageUrl: c.author.profileImageUrl,
        },
        reactionCount: c.commentReactionStats?.totalCount || 0,
        isReacted: Object.values(c.commentReactionStats?.summaries || {}).some((s: any) => s.reactedByMe),
        isAuthor: false, // Same issue as post
        isDeleted: c.isDeleted,
        createdAt: c.createdAt,
        updatedAt: c.createdAt,
        replies: c.replies?.map(mapComment),
      });
      
      return res.contents.map(mapComment);
    },
    enabled: !!id,
  });

  // Like Mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!post) return;
      if (post.isReacted) {
        await api.delete('/reactions', {
          targetType: 'POST',
          targetId: post.id,
          reactionType: 'LIKE',
        });
      } else {
        await api.post('/reactions', {
          targetType: 'POST',
          targetId: post.id,
          reactionType: 'LIKE',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
    onError: () => toast.error('좋아요 처리에 실패했습니다.'),
  });

  // Comment Mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post('/comments', {
        postId: Number(id),
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['post', id] }); // Update comment count
      setCommentText('');
      toast.success('댓글이 작성되었습니다.');
    },
    onError: () => toast.error('댓글 작성에 실패했습니다.'),
  });

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      toast.success('게시글이 삭제되었습니다.');
      router.push('/');
    },
    onError: () => toast.error('게시글 삭제에 실패했습니다.'),
  });

  // Delete Comment Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['post', id] }); // Update comment count
      toast.success('댓글이 삭제되었습니다.');
    },
    onError: () => toast.error('댓글 삭제에 실패했습니다.'),
  });

  if (isPostLoading) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">게시글을 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-4">삭제되었거나 존재하지 않는 게시글입니다.</p>
        <Button variant="linear" onClick={() => router.push('/')}>홈으로 돌아가기</Button>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">게시글</h1>
      </div>

      {/* Post Content */}
      <Card>
        <CardContent className="p-6">
          {/* Author & Meta */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <UserAvatar
                src={post.author.profileImageUrl}
                name={post.author.name}
                className="h-12 w-12"
              />
              <div>
                <p className="font-medium">{post.author.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{post.author.trackName}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TopicBadge topic={post.topic} />
              {post.isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/post/${post.id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Title & Content */}
          <h2 className="text-xl font-bold mb-4">{post.title}</h2>
          <div className="prose prose-sm max-w-none mb-6 whitespace-pre-wrap">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              urlTransform={(value) => value}
              components={{
                img: ({ src, alt, ...props }: any) => {
                  if (!src) return null;
                  const resolvedSrc = resolveImageSrc(src);
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolvedSrc}
                      alt={alt}
                      className="rounded-lg shadow-sm border border-border/50 max-h-[500px] object-contain my-4"
                      {...props}
                    />
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-muted-foreground">
              <button
                onClick={() => likeMutation.mutate()}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-colors hover:text-rose-500',
                  post.isReacted && 'text-rose-500'
                )}
                disabled={likeMutation.isPending}
              >
                <Heart className={cn('h-5 w-5', post.isReacted && 'fill-current')} />
                <span>{post.reactionCount}</span>
              </button>
              <div className="flex items-center gap-1.5 text-sm">
                <MessageCircle className="h-5 w-5" />
                <span>{post.commentCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Eye className="h-5 w-5" />
                <span>{post.viewCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">댓글 {post.commentCount}개</h3>

          {/* Comment Input */}
          <div className="flex gap-3 mb-6">
            <UserAvatar
              src={null}
              name="나"
              className="h-10 w-10 flex-shrink-0"
            />
            <div className="flex-1">
              <Textarea
                placeholder="댓글을 입력하세요..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] resize-none mb-2"
              />
              <div className="flex justify-end">
                <Button
                  variant="linearPrimary"
                  size="sm"
                  onClick={() => commentMutation.mutate(commentText)}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {commentMutation.isPending ? '작성 중...' : '댓글 작성'}
                </Button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {isCommentsLoading ? (
              <p className="text-center text-muted-foreground py-8">댓글을 불러오는 중...</p>
            ) : comments?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
              </p>
            ) : (
              comments?.map((comment: Comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDelete={() => deleteCommentMutation.mutate(comment.id)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletePostMutation.mutate()} 
              className="bg-destructive text-destructive-foreground"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 lg:h-0" />
    </div>
  );
}

function CommentItem({ comment, onDelete }: { comment: Comment; onDelete: () => void }) {
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko });

  return (
    <div className={cn('flex gap-3', comment.isDeleted && 'opacity-60')}>
      <UserAvatar
        src={comment.author.profileImageUrl}
        name={comment.author.name}
        className="h-9 w-9 flex-shrink-0"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {/* comment.isAuthor check is tricky without client-side user info, relying on mapping/assumption for now or API returning it in future */}
          {!comment.isDeleted && (
             // Placeholder for permission check: comment.isAuthor
            <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 px-2 text-muted-foreground">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className={cn('text-sm mt-1', comment.isDeleted && 'text-muted-foreground italic')}>
          {comment.content}
        </p>
        
        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-muted space-y-3">
                {comment.replies.map((reply: Comment) => (
                    <CommentItem key={reply.id} comment={reply} onDelete={onDelete} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-7 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}
