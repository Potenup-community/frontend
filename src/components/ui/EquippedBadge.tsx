import { EquippedItem } from '@/lib/api';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

function resolveItemSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/')) return `${IMAGE_BASE_URL}${url}`;
  return url;
}

export function EquippedBadge({
  items,
  className = 'h-[18px] w-auto',
}: {
  items?: EquippedItem[];
  className?: string;
}) {
  const badge = items?.find((i) => i.itemType === 'BADGE');
  if (!badge?.imageUrl) return null;

  return (
    <img
      src={resolveItemSrc(badge.imageUrl)}
      alt="Badge"
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
