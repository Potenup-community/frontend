'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopApi, pointApi, ShopItemSummaryDto, ShopItemType, resolveApiImageUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Store, Coins, ShoppingCart, Package, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProfilePreview } from '@/contexts/ProfilePreviewContext';

const ITEM_TYPE_LABEL: Record<ShopItemType, string> = {
  BADGE: '뱃지',
  PET: '펫',
  FRAME: '프레임',
};

const ITEM_TYPE_ORDER: ShopItemType[] = ['PET', 'FRAME', 'BADGE'];

type FilterType = 'ALL' | ShopItemType;

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PET', label: '펫' },
  { value: 'FRAME', label: '프레임' },
  { value: 'BADGE', label: '뱃지' },
];

export default function ShopPage() {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selectedItem, setSelectedItem] = useState<ShopItemSummaryDto | null>(null);
  const { previewItems, setPreviewItem, clearPreviewItem, clearPreview } = useProfilePreview();
  const queryClient = useQueryClient();

  useEffect(() => () => clearPreview(), [clearPreview]);

  const { data: groups, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', 'items'],
    queryFn: () => shopApi.getItems(),
  });

  const { data: balance } = useQuery({
    queryKey: ['points', 'balance'],
    queryFn: () => pointApi.getBalance(),
  });

  const purchaseMutation = useMutation({
    mutationFn: (itemId: number) => shopApi.purchase(itemId),
    onSuccess: () => {
      toast.success('구매가 완료됐습니다! 인벤토리에서 확인하세요.');
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'me'] });
      setSelectedItem(null);
    },
    onError: () => toast.error('구매에 실패했습니다. 포인트가 부족할 수 있습니다.'),
  });

  const sortedGroups = groups
    ? [...groups].sort((a, b) => ITEM_TYPE_ORDER.indexOf(a.itemType) - ITEM_TYPE_ORDER.indexOf(b.itemType))
    : [];

  const filteredGroups = sortedGroups.filter(
    (g) => filter === 'ALL' || g.itemType === filter
  );

  const allItems = filteredGroups.flatMap((g) => g.items);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">상점</h1>
            <p className="text-sm text-muted-foreground">포인트로 꾸미기 아이템을 구매하세요</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm">
          <Coins className="h-4 w-4" />
          {balance?.balance.toLocaleString() ?? 0} P
        </div>
      </div>

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

      {/* 아이템 목록 */}
      {shopLoading ? (
        <ShopSkeleton />
      ) : !allItems.length ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">등록된 아이템이 없습니다</p>
        </div>
      ) : filter === 'ALL' ? (
        // 전체 탭: 카테고리 섹션으로 구분
        <div className="space-y-10">
          {filteredGroups.map((group) => {
            if (!group.items.length) return null;
            return (
              <section key={group.itemType}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-semibold">{ITEM_TYPE_LABEL[group.itemType]}</h2>
                  <Badge variant="secondary">{group.items.length}</Badge>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {group.items.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      onSelect={() => setSelectedItem(item)}
                      isPreviewing={previewItems[item.itemType] === item.imageUrl}
                      onPreview={() => {
                        if (!item.imageUrl) return;
                        if (previewItems[item.itemType] === item.imageUrl) {
                          clearPreviewItem(item.itemType);
                          return;
                        }
                        setPreviewItem(item.itemType, item.imageUrl);
                      }}
                      canAfford={(balance?.balance ?? 0) >= item.price}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        // 특정 탭: 단일 그리드
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {allItems.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              onSelect={() => setSelectedItem(item)}
              isPreviewing={previewItems[item.itemType] === item.imageUrl}
              onPreview={() => {
                if (!item.imageUrl) return;
                if (previewItems[item.itemType] === item.imageUrl) {
                  clearPreviewItem(item.itemType);
                  return;
                }
                setPreviewItem(item.itemType, item.imageUrl);
              }}
              canAfford={(balance?.balance ?? 0) >= item.price}
            />
          ))}
        </div>
      )}

      {/* 구매 확인 다이얼로그 */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>아이템 구매</DialogTitle>
            <DialogDescription>아이템을 구매하시겠습니까?</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center overflow-hidden border">
                {selectedItem.imageUrl ? (
                  <img src={resolveApiImageUrl(selectedItem.imageUrl)} alt={selectedItem.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold">{selectedItem.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {ITEM_TYPE_LABEL[selectedItem.itemType]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedItem.durationDays == null ? '영구' : `${selectedItem.durationDays}일`}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-primary font-bold">
                  <Coins className="h-4 w-4" />
                  {selectedItem.price.toLocaleString()} P
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            구매 후 잔액:{' '}
            <span className={cn(
              'font-semibold',
              (balance?.balance ?? 0) < (selectedItem?.price ?? 0) ? 'text-destructive' : 'text-foreground'
            )}>
              {((balance?.balance ?? 0) - (selectedItem?.price ?? 0)).toLocaleString()} P
            </span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>취소</Button>
            <Button
              onClick={() => selectedItem && purchaseMutation.mutate(selectedItem.id)}
              disabled={purchaseMutation.isPending || (balance?.balance ?? 0) < (selectedItem?.price ?? 0)}
            >
              {purchaseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  구매하기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShopItemCard({ item, onSelect, onPreview, isPreviewing, canAfford }: {
  item: ShopItemSummaryDto;
  onSelect: () => void;
  onPreview: () => void;
  isPreviewing: boolean;
  canAfford: boolean;
}) {
  const durationText = item.durationDays == null ? '영구' : `${item.durationDays}일`;

  return (
    <Card className="border-border/80 hover:border-primary/40 transition-colors">
      <CardContent className="p-2 h-full flex flex-col gap-1.5">
        <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {item.imageUrl ? (
            <img src={resolveApiImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-medium truncate">{item.name}</p>
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{ITEM_TYPE_LABEL[item.itemType]}</Badge>
            <Badge variant={item.consumable ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0.5">{durationText}</Badge>
          </div>
          <p className={cn('text-[11px] font-semibold', canAfford ? 'text-primary' : 'text-muted-foreground')}>
            {item.price.toLocaleString()} P
          </p>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-1">
          <Button
            variant={isPreviewing ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-1 text-[10px]"
            onClick={onPreview}
            disabled={!item.imageUrl}
          >
            <Eye className="h-3 w-3 mr-0.5" />
            미리보기
          </Button>
          <Button
            size="sm"
            className="h-6 px-1 text-[10px]"
            variant={canAfford ? 'default' : 'outline'}
            onClick={onSelect}
            disabled={!canAfford}
          >
            <ShoppingCart className="h-3 w-3 mr-0.5" />
            구매
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ShopSkeleton() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
      {[...Array(8)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-3 w-16 mt-2" />
            <Skeleton className="h-3 w-12 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
