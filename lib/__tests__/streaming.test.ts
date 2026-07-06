import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types";

const { users, session, updateUserMock } = vi.hoisted(() => {
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
      dailyStreamCount: 3,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const session = { userId: "user-listener-1", role: "listener" as const };

  return {
    users,
    session,
    updateUserMock: vi.fn((userId: string, patch: Partial<User>) => {
      const user = users.find((entry) => entry.id === userId);
      if (!user) return;
      Object.assign(user, patch);
    }),
  };
});

vi.mock("@/lib/storage", () => ({
  getAuthSession: () => session,
  getUserById: (userId: string) => users.find((entry) => entry.id === userId),
  updateUser: updateUserMock,
}));

import { incrementDailyStreamCount } from "@/lib/streaming";

describe("incrementDailyStreamCount", () => {
  beforeEach(() => {
    users[0].dailyStreamCount = 3;
    updateUserMock.mockClear();
  });

  it("increments the authenticated user's daily stream count", () => {
    incrementDailyStreamCount();

    expect(users[0].dailyStreamCount).toBe(4);
    expect(updateUserMock).toHaveBeenCalledWith("user-listener-1", {
      dailyStreamCount: 4,
    });
  });
});
