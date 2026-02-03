'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MAIN_CATEGORY_TABS, INFO_SUB_TABS } from '@/lib/constants';
import { ChevronDown } from 'lucide-react';

export function CategoryTabs() {
  const searchParams = useSearchParams();
  const currentTopic = searchParams.get('topic')?.toUpperCase() || 'ALL';
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);

  const getCurrentCategory = () => {
    if (currentTopic === 'ALL') return 'all';
    if (currentTopic === 'NOTICE') return 'notice';
    if (currentTopic === 'KNOWLEDGE' || currentTopic === 'EMPLOYMENT_TIP') return 'info';
    if (currentTopic === 'SMALL_TALK') return 'free';
    return 'all';
  };

  const currentCategory = getCurrentCategory();

  const getHref = (categoryId: string) => {
    switch (categoryId) {
      case 'all': return '/';
      case 'notice': return '/?topic=notice';
      case 'info': return '/?topic=knowledge';
      case 'free': return '/?topic=small_talk';
      default: return '/';
    }
  };

  const getInfoSubLabel = () => {
    if (currentTopic === 'KNOWLEDGE') return '지식줍줍';
    if (currentTopic === 'EMPLOYMENT_TIP') return '취업팁';
    return '정보공유';
  };

  return (
    <div className="flex items-center gap-1">
      {MAIN_CATEGORY_TABS.map((tab) => {
        const isActive = currentCategory === tab.id;

        if (tab.id === 'info') {
          return (
            <div key={tab.id} className="relative">
              <button
                onClick={() => setShowInfoDropdown(!showInfoDropdown)}
                onBlur={() => setTimeout(() => setShowInfoDropdown(false), 150)}
                className={cn(
                  'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {isActive ? getInfoSubLabel() : tab.label}
                <ChevronDown className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  showInfoDropdown && 'rotate-180'
                )} />
              </button>

              {showInfoDropdown && (
                <div className="absolute top-full left-0 mt-1 py-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[120px]">
                  {INFO_SUB_TABS.map((subTab) => (
                    <Link
                      key={subTab.topic}
                      href={`/?topic=${subTab.topic.toLowerCase()}`}
                      className={cn(
                        'block px-4 py-2 text-sm transition-colors',
                        currentTopic === subTab.topic
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-muted'
                      )}
                      onClick={() => setShowInfoDropdown(false)}
                    >
                      {subTab.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={tab.id}
            href={getHref(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}