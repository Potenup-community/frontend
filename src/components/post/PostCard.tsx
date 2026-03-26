'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EquippedBadge } from '@/components/ui/EquippedBadge';
import { TopicBadge } from '@/components/ui/TopicBadge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { reactionApi, type PostSummary } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PostCardProps {
  post: PostSummary;
  className?: string;
  titleClassName?: string;
}

export function PostCard({ post, className, titleClassName }: PostCardProps) {
  const [isReacted, setIsReacted] = useState(post.isReacted);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);

  useEffect(() => {
    setIsReacted(post.isReacted);
    setReactionCount(post.reactionCount);
  }, [post.isReacted, post.reactionCount]);

  const likeMutation = useMutation({
    mutationFn: async (nextReacted: boolean) => {
      if (nextReacted) {
        await reactionApi.addReaction({
          targetType: 'POST',
          targetId: post.id,
          reactionType: 'LIKE',
        });
        return;
      }

      await reactionApi.removeReaction({
        targetType: 'POST',
        targetId: post.id,
        reactionType: 'LIKE',
      });
    },
    onError: () => {
      setIsReacted(post.isReacted);
      setReactionCount(post.reactionCount);
      toast.error('좋아요 처리에 실패했습니다.');
    },
  });

  const handleLikeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (likeMutation.isPending) return;

    const nextReacted = !isReacted;
    setIsReacted(nextReacted);
    setReactionCount((prev) => (nextReacted ? prev + 1 : Math.max(0, prev - 1)));
    likeMutation.mutate(nextReacted);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Link href={`/post/${post.id}`} className="block group">
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md hover:border-primary/20 border-border/50',
        className
      )}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar
                src={post.author.profileImageUrl}
                name={post.author.name}
                className="h-10 w-10 flex-shrink-0 ring-2 ring-background"
                frameSrc={post.items?.find((i) => i.itemType === 'FRAME')?.imageUrl}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {post.author.trackName ? `[${post.author.trackName}] ` : ''}{post.author.name}
                  </p>
                  <EquippedBadge items={post.items} className="h-[17px] w-auto flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              </div>
            </div>
            <TopicBadge topic={post.topic} />
          </div>

          {/* Content */}
          <div className="mb-4">
            <h3 className={cn('font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors', titleClassName)}>
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {post.preview}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-5 text-muted-foreground pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={handleLikeClick}
              disabled={likeMutation.isPending}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors hover:text-rose-500',
                isReacted && 'text-rose-500',
                likeMutation.isPending && 'opacity-70'
              )}
            >
              <Heart className={cn('h-4 w-4', isReacted && 'fill-current')} />
              <span>{reactionCount}</span>
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
