'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { resumeReviewApi, ResumeReviewStatus, ResumeSection } from '@/lib/api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<
  ResumeReviewStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }
> = {
  PREPARED: { label: '대기 중', variant: 'secondary', icon: Clock },
  PROCESSING: { label: '첨삭 중', variant: 'default', icon: Loader2 },
  COMPLETED: { label: '완료', variant: 'default', icon: CheckCircle },
  FAILED: { label: '실패', variant: 'destructive', icon: XCircle },
};

const SECTION_LABELS: Record<keyof ResumeSection, string> = {
  summary: '자기소개 / 요약',
  skills: '기술 스택',
  experience: '경력 사항',
  education: '학력',
  projects: '프로젝트',
  cert: '자격증 / 수상',
};

export default function ResumeReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const reviewId = Number(id);

  const { data: review, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['resume-review', reviewId],
    queryFn: () => resumeReviewApi.getReview(reviewId),
    // Poll while processing
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PREPARED' || status === 'PROCESSING' ? 5000 : false;
    },
  });

  if (isLoading) {
    return <ResumeReviewDetailSkeleton />;
  }

  if (!review) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">이력서 첨삭 정보를 불러올 수 없습니다.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/mypage/resume-review">목록으로</Link>
        </Button>
      </div>
    );
  }

  const config = STATUS_CONFIG[review.status];
  const StatusIcon = config.icon;
  const parsedResult = tryParseResult(review.resultJason);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/mypage/resume-review">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{review.resumeReviewTitle}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(review.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })} 요청
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={config.variant} className="flex items-center gap-1">
            <StatusIcon
              className={cn(
                'h-3.5 w-3.5',
                review.status === 'PROCESSING' && 'animate-spin',
              )}
            />
            {config.label}
          </Badge>
          {(review.status === 'PREPARED' || review.status === 'PROCESSING') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
            </Button>
          )}
        </div>
      </div>

      {/* Processing state */}
      {(review.status === 'PREPARED' || review.status === 'PROCESSING') && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
            <p className="font-medium">AI가 이력서를 분석하고 있습니다</p>
            <p className="text-sm text-muted-foreground mt-1">
              완료되면 자동으로 결과가 표시됩니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {review.status === 'FAILED' && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <XCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="font-medium">첨삭 처리에 실패했습니다</p>
            <p className="text-sm text-muted-foreground mt-1">
              다시 요청하거나 관리자에게 문의해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {review.status === 'COMPLETED' && review.completedAt && (
        <p className="text-xs text-muted-foreground">
          첨삭 완료: {format(new Date(review.completedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
        </p>
      )}

      {/* Submitted resume sections */}
      <SubmittedResumeSections sections={review.resumeSections} />

      {/* AI result */}
      {review.status === 'COMPLETED' && parsedResult && (
        <AiResultSection result={parsedResult} />
      )}

      {review.status === 'COMPLETED' && !parsedResult && review.resultJason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI 첨삭 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {review.resultJason}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SubmittedResumeSections({ sections }: { sections: ResumeSection }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-0">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <CardTitle className="text-base">제출한 이력서 내용</CardTitle>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="pt-4 space-y-4">
          {(Object.keys(SECTION_LABELS) as Array<keyof ResumeSection>).map((key) => (
            <div key={key}>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {SECTION_LABELS[key]}
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {sections[key] || <span className="text-muted-foreground italic">미입력</span>}
              </p>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function AiResultSection({ result }: { result: Record<string, unknown> }) {
  // Handle common result shapes from AI
  const entries = Object.entries(result);

  if (entries.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          AI 첨삭 결과
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {entries.map(([key, value]) => (
          <ResultSection key={key} title={formatResultKey(key)} value={value} />
        ))}
      </CardContent>
    </Card>
  );
}

function ResultSection({ title, value }: { title: string; value: unknown }) {
  if (typeof value === 'string') {
    return (
      <div>
        <h4 className="font-medium text-sm mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{value}</p>
        <Separator className="mt-4" />
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <h4 className="font-medium text-sm mb-2">{title}</h4>
        <ul className="space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span className="leading-relaxed">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
        <Separator className="mt-4" />
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div>
        <h4 className="font-medium text-sm mb-3">{title}</h4>
        <div className="space-y-3 pl-3 border-l-2 border-border">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <ResultSection key={k} title={formatResultKey(k)} value={v} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-medium text-sm mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{String(value)}</p>
      <Separator className="mt-4" />
    </div>
  );
}

function formatResultKey(key: string): string {
  // Convert camelCase/snake_case to readable Korean or title-case
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function tryParseResult(json?: string): Record<string, unknown> | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function ResumeReviewDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <div className="flex-1">
          <Skeleton className="h-6 w-64 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-3/4 mb-3" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-3/4 mb-3" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    </div>
  );
}
