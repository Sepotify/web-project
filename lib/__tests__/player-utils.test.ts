import { describe, expect, it } from "vitest";
import {
  cycleRepeatMode,
  getNextIndex,
  getPreviousIndex,
  moveQueueItem,
  shuffleSongs,
} from "@/lib/player-utils";
import type { Song } from "@/types";

function createSong(id: string): Song {
  return {
    id,
    title: id,
    artistId: "artist-1",
    featuredArtistIds: [],
    listenerCount: 0,
    streamCount: 0,
    durationSeconds: 180,
    createdAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("cycleRepeatMode", () => {
  it("cycles through off, all, and one repeat modes", () => {
    expect(cycleRepeatMode("off")).toBe("all");
    expect(cycleRepeatMode("all")).toBe("one");
    expect(cycleRepeatMode("one")).toBe("off");
  });
});

describe("getNextIndex", () => {
  it("moves to the next track in the queue", () => {
    expect(getNextIndex(0, 3, "off")).toBe(1);
  });

  it("restarts the queue when repeat all is enabled", () => {
    expect(getNextIndex(2, 3, "all")).toBe(0);
  });

  it("repeats the current track when repeat one is enabled", () => {
    expect(getNextIndex(2, 3, "one")).toBe(2);
  });

  it("returns null at the end of the queue when repeat is off", () => {
    expect(getNextIndex(2, 3, "off")).toBeNull();
  });
});

describe("getPreviousIndex", () => {
  it("wraps to the last track from the first position", () => {
    expect(getPreviousIndex(0, 3)).toBe(2);
  });
});

describe("shuffleSongs", () => {
  it("keeps the current song first and preserves all tracks", () => {
    const songs = [createSong("a"), createSong("b"), createSong("c")];
    const shuffled = shuffleSongs(songs, 1);

    expect(shuffled[0].id).toBe("b");
    expect(shuffled.map((song) => song.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("returns a copy when the queue has one song", () => {
    const songs = [createSong("solo")];
    expect(shuffleSongs(songs, 0)).toEqual(songs);
  });
});

describe("moveQueueItem", () => {
  it("moves an item to a new position", () => {
    expect(moveQueueItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("returns the original array for invalid indexes", () => {
    const queue = ["a", "b", "c"];
    expect(moveQueueItem(queue, -1, 1)).toBe(queue);
  });
});
