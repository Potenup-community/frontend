'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ClipboardList, Clock, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { resumeReviewApi, ResumeReviewResultContent, ResumeReviewStatus } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<ResumeReviewStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  PREPARED: { label: '대기 중', variant: 'secondary', icon: Clock },
  PROCESSING: { label: '첨삭 중', variant: 'default', icon: Loader2 },
  COMPLETED: { label: '완료', variant: 'default', icon: CheckCircle },
  FAILED: { label: '실패', variant: 'destructive', icon: XCircle },
};

export default function ResumeReviewListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['resume-reviews'],
    queryFn: () => resumeReviewApi.getMyReviews(),
    staleTime: 0,
  });

  const reviews = data?.contents || [];

  if (isLoading) {
    return <ResumeReviewListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          이력서 첨삭 내역
          {reviews.length > 0 && (
            <Badge variant="secondary">{reviews.length}</Badge>
          )}
        </h2>
        <Button asChild size="sm">
          <Link href="/mypage/resume-review/new">
            <Plus className="h-4 w-4 mr-2" />
            첨삭 요청
          </Link>
        </Button>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">이력서 첨삭 내역이 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            AI가 이력서를 분석하고 개선점을 제안해드립니다
          </p>
          <Button asChild>
            <Link href="/mypage/resume-review/new">
              <Plus className="h-4 w-4 mr-2" />
              첨삭 요청하기
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ResumeReviewCard key={review.resumeReviewId} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeReviewCard({ review }: { review: ResumeReviewResultContent }) {
  const config = STATUS_CONFIG[review.status];
  const StatusIcon = config.icon;
  const isCompleted = review.status === 'COMPLETED';

  return (
    <Card className={cn('transition-colors', isCompleted && 'hover:border-primary/50')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon
                className={cn(
                  'h-4 w-4 shrink-0',
                  review.status === 'PROCESSING' && 'animate-spin',
                  review.status === 'COMPLETED' && 'text-green-500',
                  review.status === 'FAILED' && 'text-destructive',
                  review.status === 'PREPARED' && 'text-muted-foreground',
                )}
              />
              <p className="font-medium truncate">{review.resumeReviewTitle}</p>
            </div>
            <Badge variant={config.variant} className="text-xs">
              {config.label}
            </Badge>
          </div>
          <div className="shrink-0">
            {isCompleted ? (
              <Button variant="default" size="sm" asChild>
                <Link href={`/mypage/resume-review/${review.resumeReviewId}`}>
                  결과 보기
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/mypage/resume-review/${review.resumeReviewId}`}>
                  상세 보기
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResumeReviewListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
