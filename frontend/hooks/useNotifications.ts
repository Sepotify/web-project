"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiDeleteNotification,
  apiFetchNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
} from "@/lib/api/endpoints";
import {
  getUserNotifications,
  markAllNotificationsAsRead as markAllLocal,
  markNotificationAsRead as markLocal,
  removeNotification as removeLocal,
} from "@/lib/notifications";
import { useAuth } from "@/store/AuthContext";
import type { Notification } from "@/types";

function mapApiNotification(
  entry: {
    id: number;
    type: Notification["type"];
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
  },
  userId: string,
): Notification {
  return {
    id: String(entry.id),
    userId,
    type: entry.type,
    title: entry.title,
    message: entry.message,
    link: entry.link || undefined,
    isRead: entry.is_read,
    createdAt: entry.created_at,
  };
}

export function useNotifications(userId: string | undefined) {
  const { useApiAuth } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    if (useApiAuth) {
      try {
        const data = await apiFetchNotifications();
        setNotifications(
          data.results.map((entry) => mapApiNotification(entry, userId)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load notifications.");
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setNotifications(getUserNotifications(userId));
    setIsLoading(false);
  }, [userId, useApiAuth]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return false;

      if (useApiAuth) {
        await apiMarkNotificationRead(notificationId);
        await refresh();
        return true;
      }

      const updated = markLocal(notificationId, userId);
      if (updated) await refresh();
      return updated;
    },
    [refresh, useApiAuth, userId],
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return 0;

    if (useApiAuth) {
      const result = await apiMarkAllNotificationsRead();
      await refresh();
      return result.updated;
    }

    const count = markAllLocal(userId);
    if (count > 0) await refresh();
    return count;
  }, [refresh, useApiAuth, userId]);

  const remove = useCallback(
    async (notificationId: string) => {
      if (!userId) return false;

      if (useApiAuth) {
        await apiDeleteNotification(notificationId);
        await refresh();
        return true;
      }

      const removed = removeLocal(notificationId, userId);
      if (removed) await refresh();
      return removed;
    },
    [refresh, useApiAuth, userId],
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    remove,
  };
}
