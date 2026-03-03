"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  MessageCircle,
  Heart,
  Megaphone,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  NotificationsResponse,
  NotificationResponse,
  mapNotificationResponse,
  Notification,
} from "@/lib/api";
import { toast } from "sonner";

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  POST_COMMENT: MessageCircle,
  POST_REACTION: Heart,
  COMMENT_REPLY: MessageCircle,
  COMMENT_REACTION: Heart,
  STUDY_APPLICATION: Bell,
  STUDY_APPROVED: Check,
  STUDY_DELETED: Bell,
  COMMENT_MENTION: MessageCircle,
  ANNOUNCEMENT: Megaphone,
  STUDY_RECRUIT_START: Bell,
  STUDY_RECRUIT_END: Bell,
};

export default function Notifications() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 알림 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get<NotificationsResponse | NotificationResponse[]>(
        "/notifications",
      );
      const notifications = Array.isArray(res) ? res : (res.notifications ?? []);
      return notifications.map(mapNotificationResponse);
    },
    staleTime: 0,
  });

  const notifications = data || [];

  // 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: async ({
      id,
      isBroadcast,
    }: {
      id: number;
      isBroadcast: boolean;
    }) => {
      await api.patch(`/notifications/${id}/read?isBroadcast=${isBroadcast}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
    onError: () => toast.error("알림 읽음 처리에 실패했습니다."),
  });

  // 전체 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
    onError: () => toast.error("전체 읽음 처리에 실패했습니다."),
  });

  const handleMarkAsRead = (notification: Notification) => {
    markAsReadMutation.mutate({
      id: notification.id,
      isBroadcast: notification.isBroadcast,
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate({
        id: notification.id,
        isBroadcast: notification.isBroadcast,
      });
    }
    if (notification.relatedId) {
      const isBroadcast = notification.isBroadcast;
      const path =
        notification.referenceType === "STUDY"
          ? `/studies/${notification.relatedId}?isBroadcast=${isBroadcast}`
          : `/post/${notification.relatedId}?isBroadcast=${isBroadcast}`;
      router.push(path);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>알림</CardTitle>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                모두 읽음
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
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
                  onMarkAsRead={() => handleMarkAsRead(notification)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 lg:h-0" />
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
}: {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-primary/5",
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          ["POST_REACTION", "COMMENT_REACTION"].includes(notification.type) &&
            "bg-rose-100 text-rose-500",
          ["POST_COMMENT", "COMMENT_REPLY", "COMMENT_MENTION"].includes(
            notification.type,
          ) && "bg-blue-100 text-blue-500",
          notification.type === "ANNOUNCEMENT" && "bg-amber-100 text-amber-600",
          [
            "STUDY_APPLICATION",
            "STUDY_APPROVED",
            "STUDY_DELETED",
            "STUDY_RECRUIT_START",
            "STUDY_RECRUIT_END",
          ].includes(notification.type) && "bg-emerald-100 text-emerald-600",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.isRead && "font-medium")}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
      {!notification.isRead && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead();
          }}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="border-b">
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="p-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 border-b last:border-b-0"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}