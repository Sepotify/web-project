import {
  deleteNotification as deleteStoredNotification,
  getNotifications,
  updateNotification,
} from "@/lib/storage";
import type { Notification } from "@/types";

export function getUserNotifications(userId: string): Notification[] {
  return getNotifications()
    .filter((notification) => notification.userId === userId)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function getUnreadNotificationCount(userId: string): number {
  return getUserNotifications(userId).filter((notification) => !notification.isRead).length;
}

export function markNotificationAsRead(
  notificationId: string,
  userId: string,
): boolean {
  const notification = getNotifications().find((entry) => entry.id === notificationId);
  if (!notification || notification.userId !== userId || notification.isRead) {
    return false;
  }

  updateNotification(notificationId, { isRead: true });
  return true;
}

export function markAllNotificationsAsRead(userId: string): number {
  const unread = getUserNotifications(userId).filter((notification) => !notification.isRead);

  for (const notification of unread) {
    updateNotification(notification.id, { isRead: true });
  }

  return unread.length;
}

export function removeNotification(notificationId: string, userId: string): boolean {
  const notification = getNotifications().find((entry) => entry.id === notificationId);
  if (!notification || notification.userId !== userId) {
    return false;
  }

  deleteStoredNotification(notificationId);
  return true;
}

export function formatNotificationDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
