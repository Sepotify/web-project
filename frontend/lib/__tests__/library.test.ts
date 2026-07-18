import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSingleTracks,
  searchAlbums,
  searchSongs,
  sortAlbums,
  sortSongs,
} from "@/lib/library";
import type { Album, Song } from "@/types";

vi.mock("@/lib/music", () => ({
  getArtistName: (artistId: string) =>
    artistId === "artist-sara-1" ? "Sara Artist" : "Unknown Artist",
}));

const albumA: Album = {
  id: "album-a",
  title: "Midnight Echoes",
  artistId: "artist-sara-1",
  releaseYear: 2024,
  songIds: [],
  listenerCount: 5000,
  streamCount: 12000,
  createdAt: "2024-06-01T00:00:00.000Z",
};

const albumB: Album = {
  id: "album-b",
  title: "Morning Light",
  artistId: "artist-other",
  releaseYear: 2022,
  songIds: [],
  listenerCount: 9000,
  streamCount: 20000,
  createdAt: "2022-01-01T00:00:00.000Z",
};

const songA: Song = {
  id: "song-a",
  title: "Neon Dreams",
  artistId: "artist-sara-1",
  albumId: "album-a",
  releaseYear: 2024,
  featuredArtistIds: [],
  listenerCount: 3000,
  streamCount: 8000,
  durationSeconds: 200,
  createdAt: "2024-06-01T00:00:00.000Z",
};

const songB: Song = {
  id: "song-b",
  title: "Solitude",
  artistId: "artist-sara-1",
  releaseYear: 2025,
  featuredArtistIds: [],
  listenerCount: 7000,
  streamCount: 15000,
  durationSeconds: 220,
  createdAt: "2025-01-01T00:00:00.000Z",
};

const songSingle: Song = {
  ...songB,
  id: "song-single",
  title: "Single Wave",
  albumId: undefined,
};

describe("searchAlbums", () => {
  it("finds albums by title", () => {
    const results = searchAlbums([albumA, albumB], "midnight");
    expect(results).toEqual([albumA]);
  });

  it("finds albums by artist name", () => {
    const results = searchAlbums([albumA, albumB], "sara");
    expect(results).toEqual([albumA]);
  });
});

describe("searchSongs", () => {
  it("finds songs by title or artist name", () => {
    expect(searchSongs([songA, songB], "neon")).toEqual([songA]);
    expect(searchSongs([songA, songB], "sara")).toEqual([songA, songB]);
  });
});

describe("sortAlbums", () => {
  it("sorts albums by release year and listener count", () => {
    expect(sortAlbums([albumA, albumB], "newest").map((album) => album.id)).toEqual([
      "album-a",
      "album-b",
    ]);
    expect(sortAlbums([albumA, albumB], "most_listeners").map((album) => album.id)).toEqual([
      "album-b",
      "album-a",
    ]);
  });
});

describe("sortSongs", () => {
  it("sorts songs by release year and stream count", () => {
    expect(sortSongs([songA, songB], "newest").map((song) => song.id)).toEqual([
      "song-b",
      "song-a",
    ]);
    expect(sortSongs([songA, songB], "most_streams").map((song) => song.id)).toEqual([
      "song-b",
      "song-a",
    ]);
  });
});

describe("getSingleTracks", () => {
  it("returns only tracks without an album id", () => {
    expect(getSingleTracks([songA, songSingle])).toEqual([songSingle]);
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});
