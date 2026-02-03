'use client';

import Link from 'next/link';

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-md overflow-hidden">
        <span className="text-white font-bold text-lg tracking-tight">D</span>
      </div>
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Depth
        </span>
      )}
    </Link>
  );
}