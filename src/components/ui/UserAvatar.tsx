'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const DEFAULT_PROFILE_IMAGE = '/default-profile.svg';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ src, name, className, fallbackClassName }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Use default image if src is null, undefined, empty, or if image failed to load
  const imageSrc = (!src || imageError) ? DEFAULT_PROFILE_IMAGE : src;

  return (
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
}

export { DEFAULT_PROFILE_IMAGE };
