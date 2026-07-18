import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types";

const { users, updateUserMock } = vi.hoisted(() => {
  const users: User[] = [
    {
      id: "user-listener-1",
      email: "listener@example.com",
      password: "123456",
      displayName: "Ali Listener",
      username: "ali_listener",
      role: "listener",
      subscription: "silver",
      followerIds: [],
      followingUserIds: [],
      followingArtistIds: [],
      dailyStreamCount: 0,
      notificationPreferences: {
        new_release: false,
      },
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  return {
    users,
    updateUserMock: vi.fn((userId: string, patch: Partial<User>) => {
      const user = users.find((entry) => entry.id === userId);
      if (!user) return;
      Object.assign(user, patch);
    }),
  };
});

vi.mock("@/lib/storage", () => ({
  getUserById: (userId: string) => users.find((entry) => entry.id === userId),
  updateUser: updateUserMock,
}));

import {
  getUserNotificationPreferences,
  isNotificationTypeEnabled,
  updateUserNotificationPreference,
} from "@/lib/notification-preferences";

describe("getUserNotificationPreferences", () => {
  it("merges user overrides with defaults", () => {
    expect(getUserNotificationPreferences("user-listener-1").new_release).toBe(false);
    expect(getUserNotificationPreferences("user-listener-1").subscription_expiring).toBe(
      true,
    );
  });
});

describe("isNotificationTypeEnabled", () => {
  it("returns false when the user disabled a notification type", () => {
    expect(isNotificationTypeEnabled("user-listener-1", "new_release")).toBe(false);
  });
});

describe("updateUserNotificationPreference", () => {
  beforeEach(() => {
    users[0].notificationPreferences = { new_release: false };
    updateUserMock.mockClear();
  });

  it("persists a notification preference on the user record", () => {
    updateUserNotificationPreference("user-listener-1", "subscription_expiring", false);

    expect(updateUserMock).toHaveBeenCalled();
    expect(
      getUserNotificationPreferences("user-listener-1").subscription_expiring,
    ).toBe(false);
  });
});
