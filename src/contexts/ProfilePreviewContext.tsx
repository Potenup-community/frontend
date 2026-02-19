'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ShopItemType } from '@/lib/api';

type PreviewItems = Partial<Record<ShopItemType, string>>;

interface ProfilePreviewContextValue {
  previewItems: PreviewItems;
  setPreviewItem: (itemType: ShopItemType, imageUrl: string) => void;
  clearPreviewItem: (itemType: ShopItemType) => void;
  clearPreview: () => void;
}

const ProfilePreviewContext = createContext<ProfilePreviewContextValue | undefined>(undefined);

export function ProfilePreviewProvider({ children }: { children: React.ReactNode }) {
  const [previewItems, setPreviewItems] = useState<PreviewItems>({});

  const setPreviewItem = useCallback((itemType: ShopItemType, imageUrl: string) => {
    setPreviewItems((prev) => ({ ...prev, [itemType]: imageUrl }));
  }, []);

  const clearPreviewItem = useCallback((itemType: ShopItemType) => {
    setPreviewItems((prev) => {
      const next = { ...prev };
      delete next[itemType];
      return next;
    });
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewItems({});
  }, []);

  const value = useMemo(
    () => ({ previewItems, setPreviewItem, clearPreviewItem, clearPreview }),
    [previewItems, setPreviewItem, clearPreviewItem, clearPreview]
  );

  return <ProfilePreviewContext.Provider value={value}>{children}</ProfilePreviewContext.Provider>;
}

export function useProfilePreview() {
  const context = useContext(ProfilePreviewContext);
  if (!context) {
    throw new Error('useProfilePreview must be used within ProfilePreviewProvider');
  }
  return context;
}
