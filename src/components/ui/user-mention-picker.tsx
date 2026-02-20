'use client';

import { ChangeEvent, KeyboardEvent, UIEvent, useEffect, useMemo, useRef, useState } from 'react';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MentionableUser {
  userId: number;
  name: string;
  profileImageUrl?: string;
  trackId?: number;
  trackName?: string;
  email?: string;
}

interface UserMentionPickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  users: MentionableUser[];
  onSelectUser: (user: MentionableUser) => void;
  onMentionQueryChange?: (query: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

export function UserMentionPicker({
  id,
  value,
  onChange,
  users,
  onSelectUser,
  onMentionQueryChange,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  placeholder,
  className,
  disabled = false,
  loading = false,
  emptyMessage = '검색 결과가 없습니다.',
}: UserMentionPickerProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = mentionQuery.trim().toLowerCase();

    return users.filter((user) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.trackName?.toLowerCase().includes(normalizedQuery) ||
        user.email?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [mentionQuery, users]);

  useEffect(() => {
    if (activeIndex >= filteredUsers.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredUsers.length]);

  const hideMentions = () => {
    setShowMentions(false);
    setActiveIndex(0);
  };

  const emitMentionQueryChange = (query: string) => {
    onMentionQueryChange?.(query);
  };

  const updateMentionQuery = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      emitMentionQueryChange(atMatch[1]);
      setShowMentions(true);
      setActiveIndex(0);
      return;
    }

    emitMentionQueryChange('');
    hideMentions();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    onChange(nextValue);

    if (disabled) {
      emitMentionQueryChange('');
      hideMentions();
      return;
    }

    updateMentionQuery(nextValue, event.target.selectionStart ?? nextValue.length);
  };

  const selectMention = (user: MentionableUser) => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const cursorPos = input.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (!atMatch) {
      return;
    }

    const nextValue = `@${user.name}`;

    onChange(nextValue);
    onSelectUser(user);
    emitMentionQueryChange('');
    hideMentions();

    setTimeout(() => {
      const nextCursorPos = nextValue.length;
      input.focus();
      input.setSelectionRange(nextCursorPos, nextCursorPos);
    }, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showMentions || filteredUsers.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredUsers.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev === 0 ? filteredUsers.length - 1 : prev - 1,
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      selectMention(filteredUsers[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      emitMentionQueryChange('');
      hideMentions();
    }
  };

  const handleMentionListScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!showMentions || !hasMore || loadingMore || loading || !onLoadMore) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 24;

    if (nearBottom) {
      onLoadMore();
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() =>
          setTimeout(() => {
            emitMentionQueryChange('');
            hideMentions();
          }, 200)
        }
        disabled={disabled}
        className={cn('h-10', className)}
      />

      {showMentions && (
        <div
          className="absolute left-0 right-0 bottom-full mb-1 bg-popover border border-border rounded-md shadow-md max-h-[200px] overflow-y-auto z-50"
          onScroll={handleMentionListScroll}
        >
          {loading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              사용자 목록을 불러오는 중입니다...
            </p>
          ) : filteredUsers.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            <>
              {filteredUsers.map((user, index) => (
                <button
                  key={user.userId}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                    index === activeIndex ? 'bg-accent' : 'hover:bg-accent',
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectMention(user);
                  }}
                >
                  <UserAvatar src={user.profileImageUrl} name={user.name} className="h-6 w-6" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    {(user.trackName || user.email) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {[user.trackName, user.email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </button>
              ))}

              {loadingMore && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  사용자 목록을 더 불러오는 중입니다...
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
