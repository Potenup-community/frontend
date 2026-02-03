'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, User, PenSquare, Bell, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { api, UnreadCountResponse } from '@/lib/api';
import { NotificationSheet } from '@/components/notifications/NotificationSheet';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

type NavItem = 
  | { type: 'write' }
  | { type: 'notification' }
  | { type?: never; href: string; label: string; icon: LucideIcon };

export function FloatingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get<UnreadCountResponse>('/notifications/unread-count');
      return res;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const unreadCount = unreadData?.count || 0;

  const navItems: NavItem[] = [
    { href: '/', label: '홈', icon: Home },
    { href: '/studies', label: '스터디', icon: Users },
    { type: 'write' },
    { type: 'notification' },
    { href: '/mypage', label: '마이', icon: User },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') {
      return pathname === '/' || pathname?.startsWith('/topic');
    }
    return pathname?.startsWith(href);
  };

  const handleWriteClick = () => {
    if (isAuthenticated) {
      router.push('/post/write');
    } else {
      router.push('/signin');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item, index) => {
            if ('type' in item && item.type === 'write') {
              return (
                <button
                  key="write"
                  onClick={handleWriteClick}
                  className="flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <PenSquare className="h-5 w-5" />
                </button>
              );
            }

            if ('type' in item && item.type === 'notification') {
              return (
                <NotificationSheet
                  key="notification"
                  trigger={
                    <button
                      className={cn(
                        'relative flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                        'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <div className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium">알림</span>
                    </button>
                  }
                />
              );
            }

            const navItem = item as { href: string; label: string; icon: LucideIcon };
            const Icon = navItem.icon;
            const active = isActive(navItem.href);

            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                </div>
                <span className="text-[10px] font-medium">{navItem.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background" />
    </nav>
  );
}