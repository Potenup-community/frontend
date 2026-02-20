'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Users, Plus, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EquippedBadge } from '@/components/ui/EquippedBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { api, Study, adminApi, scheduleApi } from '@/lib/api';
import { BUDGET_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

export default function Studies() {
  const [selectedTrack, setSelectedTrack] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: tracks } = useQuery({
    queryKey: ['tracks'],
    queryFn: async () => {
      const res = await adminApi.getTracks();
      return res.content || [];
    },
  });

  const fetchStudies = async ({ pageParam = 0 }) => {
    const params: Record<string, any> = {
      page: pageParam,
      size: 10,
    };
    if (selectedTrack) params.trackId = selectedTrack;
    if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;

    const res: any = await api.get('/studies', params);

    // Map API response to Study interface
    const content = res.content.map((item: any): Study => ({
      id: item.id,
      name: item.name,
      description: item.description,
      capacity: item.capacity,
      currentMemberCount: item.currentMemberCount,
      status: item.status,
      budget: item.budget,
      chatUrl: item.chatUrl,
      refUrl: item.refUrl,
      tags: item.tags || [],
      leader: {
        id: item.leader?.id,
        name: item.leader?.name,
        trackId: item.leader?.trackId,
        trackName: item.leader?.trackName,
        profileImageUrl: item.leader?.profileImageUrl,
        items: item.leader?.items || [],
      },
      schedule: item.schedule,
      isLeader: item.isLeader,
      isParticipant: item.isParticipant,
      isRecruitmentClosed: item.isRecruitmentClosed,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      content,
      hasNext: res.hasNext,
      pageNumber: res.pageNumber,
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['studies', selectedTrack, selectedStatus],
    queryFn: fetchStudies,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.pageNumber + 1 : undefined),
    staleTime: 0,
  });

  const studies = data?.pages.flatMap((page) => page.content) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">스터디 모집</h1>
          <p className="text-muted-foreground mt-1">
            함께 성장할 스터디를 찾아보세요
          </p>
        </div>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md" asChild>
          <Link href="/studies/create">
            <Plus className="h-4 w-4 mr-1" />
            스터디 개설
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* 상태 탭 필터 */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { value: 'all', label: '전체' },
            { value: 'PENDING', label: '모집중' },
            { value: 'CLOSED', label: '모집마감' },
            { value: 'APPROVED', label: '승인 완료' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-all duration-200',
                selectedStatus === tab.value
                  ? 'text-primary font-bold bg-primary/10'
                  : 'text-muted-foreground font-medium hover:text-primary hover:bg-primary/5'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 트랙 필터 */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setSelectedTrack(0)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm transition-all duration-200',
              selectedTrack === 0
                ? 'text-primary font-bold bg-primary/10'
                : 'text-muted-foreground font-medium hover:text-primary hover:bg-primary/5'
            )}
          >
            전체 트랙
          </button>
          {tracks?.map((track) => (
            <button
              key={track.trackId}
              onClick={() => setSelectedTrack(track.trackId)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-all duration-200',
                selectedTrack === track.trackId
                  ? 'text-primary font-bold bg-primary/10'
                  : 'text-muted-foreground font-medium hover:text-primary hover:bg-primary/5'
              )}
            >
              {track.trackName}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Banner */}
      <ScheduleBanner />

      {/* Studies List */}
      {isLoading ? (
        <StudyListSkeleton />
      ) : studies.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">모집 중인 스터디가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {studies.map((study, index) => (
            <div
              key={study.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <StudyCard study={study} />
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="linear"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                불러오는 중...
              </>
            ) : (
              '더 보기'
            )}
          </Button>
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20 lg:h-0" />
    </div>
  );
}

function StudyCard({ study }: { study: Study }) {
  const timeAgo = formatDistanceToNow(new Date(study.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  const isFull = study.currentMemberCount >= study.capacity;

  return (
    <Link href={`/studies/${study.id}`}>
      <Card className="card-interactive h-full">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar
                src={study.leader.profileImageUrl}
                name={study.leader.name}
                className="h-10 w-10 flex-shrink-0"
                frameSrc={study.leader.items?.find((i) => i.itemType === 'FRAME')?.imageUrl}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-medium text-sm truncate">{study.leader.name}</p>
                  <EquippedBadge items={study.leader.items} className="h-[13px] w-auto flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              </div>
            </div>
            <Badge
              variant={isFull ? 'secondary' : 'default'}
              className={cn(!isFull && 'bg-success text-success-foreground')}
            >
              {isFull ? '마감' : '모집중'}
            </Badge>
          </div>

          {/* Content */}
          <h3 className="font-semibold text-base mb-2 line-clamp-1">
            {study.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {study.description}
          </p>

          {/* Tags */}
          {study.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {study.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {study.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{study.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>
                {study.currentMemberCount}/{study.capacity}명
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-xs font-normal">
                {BUDGET_LABELS[study.budget as keyof typeof BUDGET_LABELS] || study.budget}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ScheduleBanner() {
  const { data: schedule } = useQuery({
    queryKey: ['my-schedules'],
    queryFn: () => scheduleApi.getMySchedules(),
    staleTime: 0,
  });

  if (!schedule) return null;

  const today = new Date();
  const label = schedule.monthName || schedule.months;

  const candidates: { text: string; color: string; days: number }[] = [];

  if (schedule.recruitStartDate) {
    const days = differenceInDays(new Date(schedule.recruitStartDate), today);
    if (days > 0) {
      candidates.push({ text: `${label}차 스터디 모집 ${days}일 전이에요!`, color: 'text-blue-600', days });
    } else if (days === 0) {
      candidates.push({ text: `${label}차 스터디 모집이 오늘 시작돼요!`, color: 'text-green-600', days: 0 });
    }
  }

  if (schedule.recruitEndDate) {
    const days = differenceInDays(new Date(schedule.recruitEndDate), today);
    if (days > 0) {
      candidates.push({ text: `${label}차 스터디 모집 마감 ${days}일 전이에요!`, color: 'text-orange-600', days });
    } else if (days === 0) {
      candidates.push({ text: `${label}차 스터디 모집이 오늘 마감돼요!`, color: 'text-red-600', days: 0 });
    }
  }

  if (schedule.studyEndDate) {
    const days = differenceInDays(new Date(schedule.studyEndDate), today);
    if (days > 0) {
      candidates.push({ text: `${label}차 스터디 종료 ${days}일 전이에요!`, color: 'text-purple-600', days });
    } else if (days === 0) {
      candidates.push({ text: `${label}차 스터디가 오늘 종료돼요!`, color: 'text-red-600', days: 0 });
    }
  }

  if (candidates.length === 0) return null;

  const closest = candidates.sort((a, b) => a.days - b.days)[0];

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border border-border/60">
      <Calendar className={cn("h-4 w-4 flex-shrink-0", closest.color)} />
      <span className={cn("text-sm font-medium", closest.color)}>
        {closest.text}
      </span>
    </div>
  );
}

function StudyListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
