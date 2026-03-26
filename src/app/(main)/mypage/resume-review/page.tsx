'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ClipboardList, Clock, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { resumeReviewApi, ResumeReviewResultContent, ResumeReviewStatus } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
    refetchInterval: (query) => {
      const contents = query.state.data?.contents || [];
      const hasPending = contents.some(
        (item) => item.status === 'PREPARED' || item.status === 'PROCESSING'
      );
      return hasPending ? 5000 : false;
    },
  });

  const reviews = data?.contents || [];
  const prevStatusRef = useRef<Record<number, ResumeReviewStatus>>({});

  useEffect(() => {
    if (reviews.length === 0) return;

    const prev = prevStatusRef.current;

    for (const review of reviews) {
      const oldStatus = prev[review.resumeReviewId];
      if (oldStatus && oldStatus !== 'COMPLETED' && review.status === 'COMPLETED') {
        toast.success(`"${review.resumeReviewTitle}" 첨삭이 완료되었습니다.`);
      }
      prev[review.resumeReviewId] = review.status;
    }

    Object.keys(prev).forEach((id) => {
      if (!reviews.some((review) => String(review.resumeReviewId) === id)) {
        delete prev[Number(id)];
      }
    });
  }, [reviews]);

  if (isLoading) {
    return <ResumeReviewListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          내 이력서 첨삭 내역
          {reviews.length > 0 && (
            <Badge variant="secondary">{reviews.length}</Badge>
          )}
        </h2>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">이력서 첨삭 내역이 없습니다</h3>
          <p className="text-muted-foreground">
            상단 헤더의 이력서 첨삭 탭에서 새 첨삭을 요청할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ResumeReviewCard
              key={review.resumeReviewId}
              review={review}
            />
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
  const isInProgress = review.status === 'PREPARED' || review.status === 'PROCESSING';

  const handlePendingClick = () => {
    toast.info('아직 분석이 진행 중입니다. 완료되면 알림으로 알려드릴게요.');
  };

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
            ) : isInProgress ? (
              <Button variant="outline" size="sm" onClick={handlePendingClick}>
                분석 중
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
      <div className="flex items-center">
        <Skeleton className="h-7 w-40" />
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
