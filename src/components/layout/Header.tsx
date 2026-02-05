'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, PenSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { api, UnreadCountResponse } from '@/lib/api';
import { Logo } from './Logo';
import { NotificationSheet } from '@/components/notifications/NotificationSheet';
import { useQuery } from '@tanstack/react-query';

const NAV_TABS = [
  { href: '/', label: '홈', topic: null },
  { href: '/?topic=notice', label: '공지사항', topic: 'NOTICE' },
  { href: '/?topic=knowledge', label: '정보공유', topic: ['KNOWLEDGE', 'EMPLOYMENT_TIP'] },
  { href: '/?topic=small_talk', label: '자유게시판', topic: 'SMALL_TALK' },
  { href: '/studies', label: '스터디', topic: null },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTopic = searchParams.get('topic')?.toUpperCase();
  const { user, isAuthenticated } = useAuth();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get<UnreadCountResponse>('/notifications/unread-count');
      return res;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // 30초마다 갱신
    staleTime: 10000,
  });

  const unreadCount = unreadData?.count || 0;

  const isActive = (tab: typeof NAV_TABS[number]) => {
    if (tab.href === '/studies') {
      return pathname.startsWith('/studies');
    }
    
    if (pathname !== '/') return false;

    if (tab.topic === null) {
      return !currentTopic;
    }

    if (Array.isArray(tab.topic)) {
      return tab.topic.includes(currentTopic || '');
    }

    return currentTopic === tab.topic;
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Nav */}
          <div className="flex items-center gap-8">
            <Logo />

            {/* PC Navigation Tabs */}
            <nav className="hidden lg:flex items-center">
              {NAV_TABS.map((tab) => {
                const active = isActive(tab);
                return (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className={cn(
                      'relative px-4 py-5 text-sm font-medium transition-colors',
                      active
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-primary'
                    )}
                  >
                    {tab.label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>

            {isAuthenticated ? (
              <>
                <NotificationSheet
                  trigger={
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  }
                />
                
                <Button 
                  onClick={() => router.push('/post/write')}
                  variant="linearPrimary"
                  size="sm"
                  className="hidden sm:flex gap-2"
                >
                  <PenSquare className="h-4 w-4" />
                  글쓰기
                </Button>

                <Link href="/mypage" className="ml-2">
                  <UserAvatar
                    src={user?.profileImageUrl}
                    name={user?.name}
                    className="h-8 w-8 border-2 border-border hover:border-primary transition-colors"
                  />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="linear" size="sm" onClick={() => router.push('/signin')}>
                  로그인
                </Button>
                <Button variant="linearPrimary" size="sm" onClick={() => router.push('/signup')}>
                  회원가입
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}