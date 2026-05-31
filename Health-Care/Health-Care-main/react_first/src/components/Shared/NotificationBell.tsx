import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  Inbox,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { notificationsApi } from "@/api/notifications";
import type { Notification } from "@/types/api";

interface NotificationBellProps {
  isArabic?: boolean;
  className?: string;
}

const getNotificationTitle = (notification: Notification) => {
  return notification.title || notification.message || "Notification";
};

const getNotificationMessage = (notification: Notification) => {
  return notification.message || notification.title || "";
};

const getNotificationDate = (notification: Notification) => {
  return notification.created_at || "";
};

const getIsRead = (notification: Notification) => {
  return Boolean(notification.is_read);
};

const formatNotificationDate = (date: string, isArabic?: boolean) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleString(isArabic ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotificationBell({
  isArabic = false,
  className,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !getIsRead(notification))
      .length;
  }, [notifications]);

  const visibleNotifications = useMemo(() => {
    return notifications.slice(0, 6);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await notificationsApi.getNotifications();

      setNotifications(
        [...(data || [])].sort((a, b) => {
          const dateA = new Date(getNotificationDate(a)).getTime();
          const dateB = new Date(getNotificationDate(b)).getTime();

          return dateB - dateA;
        })
      );
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(
        isArabic ? "تعذر تحميل الإشعارات" : "Unable to load notifications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOpen = async () => {
    setIsOpen((prev) => !prev);

    if (!isOpen && notifications.length === 0) {
      await fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    const id = Number(notification.id);

    if (!id || getIsRead(notification)) return;

    try {
      setIsMarkingRead(id);

      await notificationsApi.markAsRead(id);

      setNotifications((prev) =>
        prev.map((item) =>
          Number(item.id) === id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError(
        isArabic
          ? "تعذر تحديث حالة الإشعار"
          : "Unable to update notification"
      );
    } finally {
      setIsMarkingRead(null);
    }
  };

  const handleRefresh = async () => {
    await fetchNotifications();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleToggleOpen}
        className="relative h-10 w-10 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
        aria-label={isArabic ? "الإشعارات" : "Notifications"}
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm",
              isArabic ? "-left-1" : "-right-1"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card
          className={cn(
            "absolute top-12 z-[80] w-[320px] overflow-hidden rounded-[20px] border border-border bg-card text-card-foreground shadow-[0_22px_55px_rgba(15,23,42,0.20)] sm:w-[380px]",
            isArabic ? "left-0 text-right" : "right-0 text-left"
          )}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isArabic ? "الإشعارات" : "Notifications"}
              </h3>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {unreadCount > 0
                  ? isArabic
                    ? `${unreadCount} غير مقروء`
                    : `${unreadCount} unread`
                  : isArabic
                  ? "لا توجد إشعارات غير مقروءة"
                  : "No unread notifications"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                disabled={isLoading}
                aria-label={isArabic ? "تحديث" : "Refresh"}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted"
                aria-label={isArabic ? "إغلاق" : "Close"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {isLoading && notifications.length === 0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {isArabic
                    ? "جاري تحميل الإشعارات..."
                    : "Loading notifications..."}
                </p>
              </div>
            ) : error ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl bg-red-500/5 p-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>

                <p className="text-sm font-medium text-red-500">{error}</p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                >
                  {isArabic ? "إعادة المحاولة" : "Try again"}
                </Button>
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl bg-muted/20 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Inbox className="h-6 w-6 text-primary" />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {isArabic ? "لا توجد إشعارات" : "No notifications"}
                  </h4>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {isArabic
                      ? "أي تحديث جديد سيظهر هنا مباشرة."
                      : "Any new update will appear here."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleNotifications.map((notification) => {
                  const isRead = getIsRead(notification);
                  const id = Number(notification.id);

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleMarkAsRead(notification)}
                      className={cn(
                        "group w-full rounded-2xl border p-3 text-start transition-all duration-200",
                        isRead
                          ? "border-border bg-background hover:bg-muted/30"
                          : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            isRead ? "bg-muted" : "bg-primary/10"
                          )}
                        >
                          {isRead ? (
                            <Check className="h-4 w-4 text-muted-foreground" />
                          ) : isMarkingRead === id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Bell className="h-4 w-4 text-primary" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <h4
                              className={cn(
                                "line-clamp-1 text-sm font-semibold",
                                isRead ? "text-foreground" : "text-primary"
                              )}
                            >
                              {getNotificationTitle(notification)}
                            </h4>

                            {!isRead && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>

                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {getNotificationMessage(notification)}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              {formatNotificationDate(
                                getNotificationDate(notification),
                                isArabic
                              )}
                            </span>

                            {!isRead && (
                              <Badge
                                variant="outline"
                                className="border-primary/20 bg-primary/5 px-2 py-0 text-[10px] text-primary"
                              >
                                {isArabic ? "جديد" : "New"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {notifications.length > 6 && (
            <div className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
              {isArabic
                ? `يتم عرض آخر 6 إشعارات من أصل ${notifications.length}`
                : `Showing latest 6 of ${notifications.length} notifications`}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}