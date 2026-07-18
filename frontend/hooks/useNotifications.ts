"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserNotifications } from "@/lib/notifications";
import type { Notification } from "@/types";

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setNotifications(getUserNotifications(userId));
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return { notifications, unreadCount, isLoading, refresh };
}
