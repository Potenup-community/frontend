'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pointApi, PointHistoryResponse, PointType } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const POINT_TYPE_LABEL: Record<PointType, string> = {
  ATTENDANCE: '출석',
  ATTENDANCE_STREAK: '연속 출석',
  WRITE_POST: '게시글 작성',
  WRITE_COMMENT: '댓글 작성',
  RECEIVE_LIKE_POST: '게시글 좋아요 받음',
  RECEIVE_LIKE_COMMENT: '댓글 좋아요 받음',
  GIVE_LIKE_POST: '게시글 좋아요',
  GIVE_LIKE_COMMENT: '댓글 좋아요',
  STUDY_CREATE: '스터디 개설',
  STUDY_JOIN: '스터디 참여',
  EVENT_ADMIN: '이벤트 지급',
  USE_SHOP: '상점 구매',
};

type FilterType = 'all' | 'earn' | 'use';

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'earn', label: '적립' },
  { value: 'use', label: '사용' },
];

export default function PointsPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['points', 'balance'],
    queryFn: () => pointApi.getBalance(),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['points', 'history'],
    queryFn: () => pointApi.getHistory({ size: 100 }),
  });

  const isUseItem = (item: PointHistoryResponse) =>
    item.type === 'USE_SHOP' || item.amount < 0;

  const filtered = history?.histories?.filter((item) => {
    if (filter === 'earn') return !isUseItem(item);
    if (filter === 'use') return isUseItem(item);
    return true;
  }) ?? [];

  return (
    <div className="space-y-6">
      {/* 잔액 카드 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">현재 포인트</p>
              {balanceLoading ? (
                <Skeleton className="h-8 w-32 mt-1" />
              ) : (
                <p className="text-3xl font-bold text-primary">
                  {balance?.balance.toLocaleString() ?? 0}
                  <span className="text-lg font-medium ml-1">P</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내역 */}
      <Card>
        <div className="px-6 pt-5 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="h-4 w-4" />
            포인트 내역
          </div>
          {/* 필터 탭 */}
          <div className="flex gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
                  filter === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {historyLoading ? (
            <HistorySkeleton />
          ) : !filtered.length ? (
            <div className="text-center py-12">
              <Coins className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">내역이 없습니다</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((item) => (
                <HistoryItem key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

function HistoryItem({ item }: { item: PointHistoryResponse }) {
  const isUse = item.type === 'USE_SHOP' || item.amount < 0;
  const displayAmount = Math.abs(item.amount).toLocaleString();

  return (
    <li className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-full',
          isUse ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
        )}>
          {isUse ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-medium">{item.description || POINT_TYPE_LABEL[item.type]}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(item.createdAt), 'yyyy-MM-dd')}
          </p>
        </div>
      </div>
      <span className={cn(
        'text-sm font-bold',
        isUse ? 'text-rose-500' : 'text-emerald-600'
      )}>
        {isUse ? '-' : '+'}{displayAmount}P
      </span>
    </li>
  );
}

function HistorySkeleton() {
  return (
    <ul className="divide-y divide-border">
      {[...Array(5)].map((_, i) => (
        <li key={i} className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </li>
      ))}
    </ul>
  );
}
