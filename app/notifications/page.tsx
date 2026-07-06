"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useNotifications } from "@/hooks/useNotifications";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  removeNotification,
} from "@/lib/notifications";
import { useAuth } from "@/store/AuthContext";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, isLoading, refresh } = useNotifications(user?.id);
  const { showToast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isLoading || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading notifications...</p>
        </div>
      </AppShell>
    );
  }

  const userId = user.id;

  function handleMarkAsRead(notificationId: string) {
    const updated = markNotificationAsRead(notificationId, userId);
    if (!updated) return;

    refresh();
    showToast("Notification marked as read.", "success");
  }

  function handleMarkAllAsRead() {
    const count = markAllNotificationsAsRead(userId);
    if (count === 0) return;

    refresh();
    showToast(
      count === 1 ? "1 notification marked as read." : `${count} notifications marked as read.`,
      "success",
    );
  }

  function handleDelete(notificationId: string) {
    const removed = removeNotification(notificationId, userId);
    if (!removed) return;

    refresh();
    showToast("Notification deleted.", "success");
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
                : "You are all caught up."}
            </p>
          </div>

          {notifications.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="w-full sm:w-auto"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="Updates about your account, subscriptions, and followed artists will appear here."
            icon="🔔"
            className="rounded-lg border border-dashed border-border-default bg-bg-elevated"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
