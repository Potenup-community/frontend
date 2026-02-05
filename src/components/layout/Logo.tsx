'use client';

import Link from 'next/link';

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          POTENUP
        </span>
      )}
    </Link>
  );
}