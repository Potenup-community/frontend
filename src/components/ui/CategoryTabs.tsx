'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { INFO_SUB_TABS } from '@/lib/constants';

export function CategoryTabs() {
  const searchParams = useSearchParams();
  const currentTopic = searchParams.get('topic')?.toUpperCase() || '';

  // Only show for Info Share topics
  if (currentTopic !== 'KNOWLEDGE' && currentTopic !== 'EMPLOYMENT_TIP') {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {INFO_SUB_TABS.map((tab) => {
        const isActive = currentTopic === tab.topic;

        return (
          <Link
            key={tab.topic}
            href={`/?topic=${tab.topic.toLowerCase()}`}
            className={cn(
              'px-4 py-2 rounded-lg text-sm transition-all duration-200',
              isActive
                ? 'text-primary font-bold bg-primary/10'
                : 'text-muted-foreground font-medium hover:text-primary hover:bg-primary/5'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}