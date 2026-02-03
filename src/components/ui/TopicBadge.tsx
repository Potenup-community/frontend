'use client';
import { cn } from '@/lib/utils';
import { TOPIC_LABELS, type TopicType } from '@/lib/constants';

interface TopicBadgeProps {
  topic: string;
  className?: string;
}

const topicStyles: Record<string, string> = {
  NOTICE: 'bg-topic-notice/10 text-topic-notice',
  KNOWLEDGE: 'bg-topic-knowledge/10 text-topic-knowledge',
  EMPLOYMENT_TIP: 'bg-topic-employment/10 text-topic-employment',
  SMALL_TALK: 'bg-topic-smalltalk/10 text-topic-smalltalk',
};

export function TopicBadge({ topic, className }: TopicBadgeProps) {
  const label = TOPIC_LABELS[topic as TopicType] || topic;
  const style = topicStyles[topic] || 'bg-secondary text-secondary-foreground';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
