import { describe, expect, it, vi } from "vitest";
import type { User } from "@/types";

const playlistsByUser = vi.hoisted(() => ({
  "user-basic": Array.from({ length: 6 }, (_, index) => ({
    id: `playlist-${index}`,
    userId: "user-basic",
    name: `Playlist ${index}`,
    songIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  })),
  "user-silver": [],
}));

vi.mock("@/lib/storage", () => ({
  getPlaylistsByUser: (userId: string) => playlistsByUser[userId as keyof typeof playlistsByUser] ?? [],
}));

import { canCreatePlaylist, getPlaylistLimitInfo } from "@/lib/playlists";

const basicUser: User = {
  id: "user-basic",
  email: "basic@example.com",
  password: "123456",
  displayName: "Jamie Basic",
  username: "jamie_basic",
  role: "listener",
  subscription: "basic",
  followerIds: [],
  followingUserIds: [],
  followingArtistIds: [],
  dailyStreamCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const silverUser: User = {
  ...basicUser,
  id: "user-silver",
  subscription: "silver",
  username: "sam_silver",
};

describe("canCreatePlaylist", () => {
  it("blocks basic users at the 6-playlist limit", () => {
    const result = canCreatePlaylist(basicUser);

    expect(result.allowed).toBe(false);
    expect(result.message).toContain("6-playlist limit");
  });

  it("allows silver users below the 100-playlist limit", () => {
    expect(canCreatePlaylist(silverUser)).toEqual({ allowed: true });
  });
});

describe("getPlaylistLimitInfo", () => {
  it("reports remaining playlist slots for limited plans", () => {
    expect(getPlaylistLimitInfo(silverUser)).toMatchObject({
      current: 0,
      limit: 100,
      remaining: 100,
    });
  });

  it("reports an empty playlist library as zero current playlists", () => {
    expect(getPlaylistLimitInfo(silverUser).current).toBe(0);
  });
});
