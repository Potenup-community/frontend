'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, InventoryItemDto, ShopItemType, resolveApiImageUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ITEM_TYPE_LABEL: Record<ShopItemType, string> = {
  BADGE: '뱃지',
  PET: '펫',
  FRAME: '프레임',
};

type FilterType = 'ALL' | ShopItemType;

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PET', label: '펫' },
  { value: 'FRAME', label: '프레임' },
  { value: 'BADGE', label: '뱃지' },
];

export default function InventoryPage() {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [isActionPending, setIsActionPending] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedActionRef = useRef<{ inventoryId: number; type: 'equip' | 'unequip' } | null>(null);
  const isSyncingRef = useRef(false);
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['inventory', 'me'],
    queryFn: () => inventoryApi.getMyInventory(),
  });

  const equipMutation = useMutation({
    mutationFn: (inventoryId: number) => inventoryApi.equip(inventoryId),
    onSuccess: () => {
      toast.success('아이템을 장착했습니다.');
      queryClient.invalidateQueries({ queryKey: ['inventory', 'me'] });
    },
    onError: () => toast.error('장착에 실패했습니다.'),
  });

  const unequipMutation = useMutation({
    mutationFn: (inventoryId: number) => inventoryApi.unequip(inventoryId),
    onSuccess: () => {
      toast.success('아이템을 해제했습니다.');
      queryClient.invalidateQueries({ queryKey: ['inventory', 'me'] });
    },
    onError: () => toast.error('해제에 실패했습니다.'),
  });

  const flushQueuedAction = async () => {
    if (isSyncingRef.current) return;
    const action = queuedActionRef.current;
    if (!action) {
      setIsActionPending(false);
      return;
    }

    queuedActionRef.current = null;
    isSyncingRef.current = true;

    try {
      if (action.type === 'equip') {
        await equipMutation.mutateAsync(action.inventoryId);
      } else {
        await unequipMutation.mutateAsync(action.inventoryId);
      }
    } finally {
      isSyncingRef.current = false;
      if (queuedActionRef.current) {
        void flushQueuedAction();
      } else {
        setIsActionPending(false);
      }
    }
  };

  const queueAction = (inventoryId: number, type: 'equip' | 'unequip') => {
    queuedActionRef.current = { inventoryId, type };
    setIsActionPending(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void flushQueuedAction();
    }, 350);
  };

  const handleEquip = (inventoryId: number) => {
    queueAction(inventoryId, 'equip');
  };

  const handleUnequip = (inventoryId: number) => {
    queueAction(inventoryId, 'unequip');
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const isPending = isActionPending || equipMutation.isPending || unequipMutation.isPending;

  const filteredGroups = groups?.filter(
    (g) => filter === 'ALL' || g.itemType === filter
  ) ?? [];

  const isEmpty = !groups?.length || groups.every((g) => g.items.length === 0);

  return (
    <div className="space-y-6">
      {/* 필터 탭 */}
      <div className="flex">
        <nav className="flex gap-1 border-b-2 border-border">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium -mb-0.5 border-b-2 transition-colors',
                filter === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <InventorySkeleton />
      ) : isEmpty ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-1">인벤토리가 비어있습니다</h3>
          <p className="text-sm text-muted-foreground">상점에서 아이템을 구매해보세요</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((group) => {
            if (!group.items.length) return null;
            return (
              <section key={group.itemType}>
                {filter === 'ALL' && (
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {ITEM_TYPE_LABEL[group.itemType]}
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.items.map((item) => (
                    <InventoryItem
                      key={item.inventoryId}
                      item={item}
                      onEquip={() => handleEquip(item.inventoryId)}
                      onUnequip={() => handleUnequip(item.inventoryId)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </section>
            );
          })}
          {filteredGroups.every((g) => !g.items.length) && (
            <div className="text-center py-12">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">해당 종류의 아이템이 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InventoryItem({
  item, onEquip, onUnequip, isPending,
}: {
  item: InventoryItemDto;
  onEquip: () => void;
  onUnequip: () => void;
  isPending: boolean;
}) {
  const remainingText =
    item.remainingDays === null
      ? '영구'
      : item.remainingDays !== undefined
        ? `${item.remainingDays}일 남음`
        : null;

  return (
    <Card className={cn(
      'relative transition-all',
      item.equipped && 'border-primary ring-1 ring-primary/30'
    )}>
      {item.equipped && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
        </div>
      )}
      <CardContent className="p-4 flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {item.imageUrl ? (
            <img src={resolveApiImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="w-full">
          <p className="text-sm font-medium truncate">{item.name}</p>
          {remainingText && (
            <p className="text-xs text-muted-foreground mt-0.5">{remainingText}</p>
          )}
        </div>
        <Button
          size="sm"
          variant={item.equipped ? 'outline' : 'default'}
          className="w-full h-8 text-xs"
          onClick={item.equipped ? onUnequip : onEquip}
          disabled={isPending}
        >
          {item.equipped ? '해제' : '장착'}
        </Button>
      </CardContent>
    </Card>
  );
}

function InventorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
