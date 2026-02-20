'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
const DEFAULT_PROFILE_IMAGE = '/default-profile.svg';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

function resolveProfileSrc(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  if (src.startsWith('/')) return `${IMAGE_BASE_URL}${src}`;
  return `${IMAGE_BASE_URL}/${src}`;
}

// 아이템 이미지 URL → 절대 경로
function resolveItemSrc(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) return src;
  if (src.startsWith('/')) return `${IMAGE_BASE_URL}${src}`;
  return src;
}

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  petSrc?: string | null;
  frameSrc?: string | null;
  frameTransform?: string;
}

export function UserAvatar({ src, name, className, fallbackClassName, petSrc, frameSrc, frameTransform }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const imageSrc = (!src || imageError) ? DEFAULT_PROFILE_IMAGE : resolveProfileSrc(src);

  const avatar = (
    <Avatar className={className}>
      <AvatarImage
        src={imageSrc}
        alt={name || 'User'}
        onError={() => setImageError(true)}
      />
      <AvatarFallback className={cn('bg-muted', fallbackClassName)}>
        <img
          src={DEFAULT_PROFILE_IMAGE}
          alt={name || 'User'}
          className="w-full h-full object-cover"
        />
      </AvatarFallback>
    </Avatar>
  );

  const resolvedPetSrc = petSrc ? resolveItemSrc(petSrc) : null;
  const resolvedFrameSrc = frameSrc ? resolveItemSrc(frameSrc) : null;

  if (!resolvedPetSrc && !resolvedFrameSrc) return avatar;

  return (
    <div className="relative inline-flex">
      {avatar}
      {resolvedFrameSrc && (
        <img
          src={resolvedFrameSrc}
          alt="Frame"
          className="absolute inset-0 z-10 aspect-square h-full w-full pointer-events-none object-contain"
          style={{
            imageRendering: 'pixelated',
            transform: frameTransform ?? 'translate(0.5%, -3%) scale(1.4)',
          }}
        />
      )}
      {resolvedPetSrc && (
        <img
          src={resolvedPetSrc}
          alt="Pet"
          className="absolute z-20 w-[47%] h-[47%] pointer-events-none"
          style={{ imageRendering: 'pixelated', bottom: '-11.5%', right: '-15.5%' }}
        />
      )}
    </div>
  );
}

export { DEFAULT_PROFILE_IMAGE };
