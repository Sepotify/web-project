import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Notification } from "@/types";

const { notifications, updateNotificationMock } = vi.hoisted(() => {
  const notifications: Notification[] = [
    {
      id: "notification-unread",
      userId: "user-listener-1",
      type: "subscription_expiring",
      title: "Your silver plan expires soon",
      message: "Your subscription ends in 3 days.",
      isRead: false,
      createdAt: "2026-07-01T10:00:00.000Z",
    },
    {
      id: "notification-read",
      userId: "user-listener-1",
      type: "new_release",
      title: "New release",
      message: "A new single is available now.",
      isRead: true,
      createdAt: "2026-07-02T10:00:00.000Z",
    },
  ];

  return {
    notifications,
    updateNotificationMock: vi.fn(
      (notificationId: string, patch: Partial<Notification>) => {
        const notification = notifications.find((entry) => entry.id === notificationId);
        if (!notification) return;
        Object.assign(notification, patch);
      },
    ),
  };
});

vi.mock("@/lib/storage", () => ({
  getNotifications: () => notifications,
  updateNotification: updateNotificationMock,
}));

import {
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";

describe("markNotificationAsRead", () => {
  beforeEach(() => {
    notifications[0].isRead = false;
    notifications[1].isRead = true;
    updateNotificationMock.mockClear();
  });

  it("marks an unread notification as read for the owning user", () => {
    const updated = markNotificationAsRead("notification-unread", "user-listener-1");

    expect(updated).toBe(true);
    expect(notifications[0].isRead).toBe(true);
    expect(updateNotificationMock).toHaveBeenCalledWith("notification-unread", {
      isRead: true,
    });
  });

  it("returns false when the notification belongs to another user", () => {
    expect(markNotificationAsRead("notification-unread", "user-other")).toBe(false);
    expect(notifications[0].isRead).toBe(false);
    expect(updateNotificationMock).not.toHaveBeenCalled();
  });

  it("returns false when the notification is already read", () => {
    expect(markNotificationAsRead("notification-read", "user-listener-1")).toBe(false);
    expect(updateNotificationMock).not.toHaveBeenCalled();
  });
});

describe("getUnreadNotificationCount", () => {
  beforeEach(() => {
    notifications[0].isRead = false;
    notifications[1].isRead = true;
  });

  it("counts only unread notifications for the user", () => {
    expect(getUnreadNotificationCount("user-listener-1")).toBe(1);
    expect(getUnreadNotificationCount("user-other")).toBe(0);
  });
});

describe("markAllNotificationsAsRead", () => {
  beforeEach(() => {
    notifications[0].isRead = false;
    notifications[1].isRead = true;
    updateNotificationMock.mockClear();
  });

  it("marks every unread notification for the user as read", () => {
    const updatedCount = markAllNotificationsAsRead("user-listener-1");

    expect(updatedCount).toBe(1);
    expect(notifications[0].isRead).toBe(true);
    expect(updateNotificationMock).toHaveBeenCalledTimes(1);
  });
});
