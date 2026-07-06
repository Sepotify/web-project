import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Artist } from "@/types";

const { artists, updateArtistMock, notifyArtistApprovalMock, notifyArtistRejectionMock } =
  vi.hoisted(() => {
  const artists: Artist[] = [
    {
      id: "artist-pending-1",
      userId: "user-pending-1",
      stageName: "Nova Waves",
      status: "pending",
      isVerified: false,
      totalListeners: 0,
      totalStreams: 0,
      createdAt: "2026-07-01T00:00:00.000Z",
    },
    {
      id: "artist-approved-1",
      userId: "user-artist-1",
      stageName: "Sara Artist",
      status: "approved",
      isVerified: true,
      totalListeners: 1200,
      totalStreams: 5000,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  return {
    artists,
    updateArtistMock: vi.fn((artistId: string, patch: Partial<Artist>) => {
      const artist = artists.find((entry) => entry.id === artistId);
      if (!artist) return;
      Object.assign(artist, patch);
    }),
    notifyArtistApprovalMock: vi.fn(),
    notifyArtistRejectionMock: vi.fn(),
  };
});

vi.mock("@/lib/storage", () => ({
  getArtistById: (artistId: string) => artists.find((entry) => entry.id === artistId),
  updateArtist: updateArtistMock,
  getUserById: vi.fn((userId: string) =>
    userId === "user-listener-1"
      ? {
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
          createdAt: "2026-01-01T00:00:00.000Z",
        }
      : undefined,
  ),
  addTicket: vi.fn(),
}));

vi.mock("@/lib/notification-events", () => ({
  notifyArtistApproval: notifyArtistApprovalMock,
  notifyArtistRejection: notifyArtistRejectionMock,
  notifyStaffOfNewTicket: vi.fn(),
}));

import { approveArtist, calculateArtistEarnings, createSupportTicket, rejectArtist } from "@/lib/admin";

describe("calculateArtistEarnings", () => {
  it("calculates monthly payout from stream count", () => {
    expect(calculateArtistEarnings(10000)).toBe(20);
    expect(calculateArtistEarnings(0)).toBe(0);
  });
});

describe("approveArtist", () => {
  beforeEach(() => {
    artists[0].status = "pending";
    artists[0].rejectionReason = "Previous reason";
    updateArtistMock.mockClear();
    notifyArtistApprovalMock.mockClear();
    notifyArtistRejectionMock.mockClear();
  });

  it("approves a pending artist and notifies them", () => {
    const approved = approveArtist("artist-pending-1");

    expect(approved).toBe(true);
    expect(artists[0].status).toBe("approved");
    expect(artists[0].rejectionReason).toBeUndefined();
    expect(updateArtistMock).toHaveBeenCalledWith("artist-pending-1", {
      status: "approved",
      rejectionReason: undefined,
    });
    expect(notifyArtistApprovalMock).toHaveBeenCalledWith("user-pending-1", "Nova Waves");
  });

  it("returns false when the artist is not pending", () => {
    expect(approveArtist("artist-approved-1")).toBe(false);
    expect(notifyArtistApprovalMock).not.toHaveBeenCalled();
  });
});

describe("rejectArtist", () => {
  beforeEach(() => {
    artists[0].status = "pending";
    artists[0].rejectionReason = undefined;
    updateArtistMock.mockClear();
    notifyArtistApprovalMock.mockClear();
    notifyArtistRejectionMock.mockClear();
  });

  it("rejects a pending artist with a reason and notifies them", () => {
    const rejected = rejectArtist("artist-pending-1", "Portfolio needs more original material.");

    expect(rejected).toBe(true);
    expect(artists[0].status).toBe("rejected");
    expect(artists[0].rejectionReason).toBe(
      "Portfolio needs more original material.",
    );
    expect(updateArtistMock).toHaveBeenCalledWith("artist-pending-1", {
      status: "rejected",
      rejectionReason: "Portfolio needs more original material.",
    });
    expect(notifyArtistRejectionMock).toHaveBeenCalledWith(
      "user-pending-1",
      "Nova Waves",
      "Portfolio needs more original material.",
    );
  });

  it("returns false when the rejection reason is empty", () => {
    expect(rejectArtist("artist-pending-1", "   ")).toBe(false);
    expect(artists[0].status).toBe("pending");
    expect(notifyArtistRejectionMock).not.toHaveBeenCalled();
  });

  it("returns false when the artist is not pending", () => {
    expect(rejectArtist("artist-approved-1", "Not eligible")).toBe(false);
    expect(notifyArtistRejectionMock).not.toHaveBeenCalled();
  });
});

describe("createSupportTicket", () => {
  it("requires a subject and message", () => {
    expect(createSupportTicket("user-listener-1", "", "Help")).toEqual({
      success: false,
      error: "Subject is required.",
    });
    expect(createSupportTicket("user-listener-1", "Playback issue", "")).toEqual({
      success: false,
      error: "Message is required.",
    });
  });
});
