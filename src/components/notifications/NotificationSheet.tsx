'use client';

import { useRouter } from 'next/navigation';
import { Bell, Check, MessageCircle, Heart, Megaphone, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, NotificationsResponse, mapNotificationResponse, Notification } from '@/lib/api';
import { toast } from 'sonner';

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  COMMENT: MessageCircle,
  REPLY: MessageCircle,
  LIKE: Heart,
  NOTICE: Megaphone,
};

interface NotificationSheetProps {
  trigger: React.ReactNode;
}

export function NotificationSheet({ trigger }: NotificationSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // 알림 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<NotificationsResponse>('/notifications');
      return res.notifications.map(mapNotificationResponse);
    },
    enabled: open,
  });

  const notifications = data || [];

  // 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: () => toast.error('알림 읽음 처리에 실패했습니다.'),
  });

  // 전체 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: () => toast.error('전체 읽음 처리에 실패했습니다.'),
  });

  const handleMarkAsRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setOpen(false);
    if (notification.relatedId) {
      router.push(`/post/${notification.relatedId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <SheetTitle>알림</SheetTitle>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
                <CheckCheck className="h-4 w-4" />
                모두 읽음
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">알림이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkAsRead={(e) => handleMarkAsRead(notification.id, e)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
}: {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: (e: React.MouseEvent) => void;
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-muted/50',
        !notification.isRead && 'bg-primary/5'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          notification.type === 'LIKE' && 'bg-rose-100 text-rose-500',
          notification.type === 'COMMENT' && 'bg-blue-100 text-blue-500',
          notification.type === 'REPLY' && 'bg-blue-100 text-blue-500',
          notification.type === 'NOTICE' && 'bg-amber-100 text-amber-600',
          !['LIKE', 'COMMENT', 'REPLY', 'NOTICE'].includes(notification.type) &&
            'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.isRead && 'font-medium')}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
      {!notification.isRead && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8"
          onClick={onMarkAsRead}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}