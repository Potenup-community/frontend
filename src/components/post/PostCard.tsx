'use client';

import Link from 'next/link';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { TopicBadge } from '@/components/ui/TopicBadge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PostSummary } from '@/lib/api';

interface PostCardProps {
  post: PostSummary;
  className?: string;
}

export function PostCard({ post, className }: PostCardProps) {
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
              />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              </div>
            </div>
            <TopicBadge topic={post.topic} />
          </div>

          {/* Content */}
          <div className="mb-4">
            <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {post.preview}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-5 text-muted-foreground pt-3 border-t border-border/50">
            <div className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              post.isReacted && 'text-rose-500'
            )}>
              <Heart className={cn('h-4 w-4', post.isReacted && 'fill-current')} />
              <span>{post.reactionCount}</span>
            </div>
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