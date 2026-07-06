import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types";

const { users, updateUserMock } = vi.hoisted(() => {
  const users: User[] = [
    {
      id: "user-a",
      email: "a@example.com",
      password: "123456",
      displayName: "User A",
      username: "user_a",
      role: "listener",
      subscription: "silver",
      followerIds: [],
      followingUserIds: [],
      followingArtistIds: [],
      dailyStreamCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "user-b",
      email: "b@example.com",
      password: "123456",
      displayName: "User B",
      username: "user_b",
      role: "listener",
      subscription: "basic",
      followerIds: [],
      followingUserIds: [],
      followingArtistIds: [],
      dailyStreamCount: 0,
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
  mutateUsers: (mutator: (current: User[]) => User[]) => {
    const next = mutator(users);
    users.splice(0, users.length, ...next);
  },
  updateUser: updateUserMock,
}));

import { followUser, isFollowingUser, unfollowUser } from "@/lib/profile";

describe("followUser", () => {
  beforeEach(() => {
    users[0].followingUserIds = [];
    users[1].followerIds = [];
    updateUserMock.mockClear();
  });

  it("follows another user and updates both profiles", () => {
    const followed = followUser("user-a", "user-b");

    expect(followed).toBe(true);
    expect(isFollowingUser("user-a", "user-b")).toBe(true);
    expect(users[1].followerIds).toContain("user-a");
  });

  it("returns false when following yourself", () => {
    expect(followUser("user-a", "user-a")).toBe(false);
  });
});

describe("unfollowUser", () => {
  beforeEach(() => {
    users[0].followingUserIds = ["user-b"];
    users[1].followerIds = ["user-a"];
    updateUserMock.mockClear();
  });

  it("unfollows a previously followed user", () => {
    const unfollowed = unfollowUser("user-a", "user-b");

    expect(unfollowed).toBe(true);
    expect(isFollowingUser("user-a", "user-b")).toBe(false);
    expect(users[1].followerIds).not.toContain("user-a");
  });
});
