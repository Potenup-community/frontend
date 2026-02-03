'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TOPIC_NAV_ITEMS } from '@/lib/constants';

export function TopicTabs() {
  const searchParams = useSearchParams();
  const currentTopic = searchParams.get('topic')?.toUpperCase() || 'ALL';

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {TOPIC_NAV_ITEMS.map((item) => {
        const isActive = currentTopic === item.topic;
        const href = item.topic === 'ALL' ? '/' : `/?topic=${item.topic.toLowerCase()}`;

        return (
          <Link
            key={item.topic}
            href={href}
            className={cn(
              'flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/50 hover:border-border'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}