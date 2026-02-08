'use client';

import Link from 'next/link';

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {showText && (
        <span className="relative text-xl font-bold group inline-block">
          <span className="text-foreground">POTENUP</span>
          <span aria-hidden className="absolute inset-0 text-orange-500 logo-text-fill">
            POTENUP
          </span>
        </span>
      )}
    </Link>
  );
}