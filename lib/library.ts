import { getArtistName } from "@/lib/music";
import type { Album, Song } from "@/types";

export type AlbumSortOption =
  | "newest"
  | "oldest"
  | "most_listeners"
  | "most_streams"
  | "title_asc";

export type SongSortOption =
  | "newest"
  | "oldest"
  | "most_listeners"
  | "most_streams"
  | "title_asc";

export const ALBUM_SORT_OPTIONS: { value: AlbumSortOption; label: string }[] = [
  { value: "newest", label: "Newest release" },
  { value: "oldest", label: "Oldest release" },
  { value: "most_listeners", label: "Most listeners" },
  { value: "most_streams", label: "Most streams" },
  { value: "title_asc", label: "Title (A–Z)" },
];

export const SONG_SORT_OPTIONS: { value: SongSortOption; label: string }[] = [
  { value: "newest", label: "Newest release" },
  { value: "oldest", label: "Oldest release" },
  { value: "most_listeners", label: "Most listeners" },
  { value: "most_streams", label: "Most streams" },
  { value: "title_asc", label: "Title (A–Z)" },
];

function getReleaseTimestamp(item: Album | Song): number {
  if (item.releaseYear) {
    return new Date(`${item.releaseYear}-01-01`).getTime();
  }
  return new Date(item.createdAt).getTime();
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query);
}

export function searchAlbums(albums: Album[], query: string): Album[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return albums;

  return albums.filter((album) => {
    const artistName = getArtistName(album.artistId);
    return (
      matchesQuery(album.title, normalized) ||
      matchesQuery(artistName, normalized)
    );
  });
}

export function searchSongs(songs: Song[], query: string): Song[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return songs;

  return songs.filter((song) => {
    const artistName = getArtistName(song.artistId);
    return (
      matchesQuery(song.title, normalized) ||
      matchesQuery(artistName, normalized)
    );
  });
}

export function sortAlbums(albums: Album[], sort: AlbumSortOption): Album[] {
  const sorted = [...albums];

  sorted.sort((a, b) => {
    switch (sort) {
      case "newest":
        return getReleaseTimestamp(b) - getReleaseTimestamp(a);
      case "oldest":
        return getReleaseTimestamp(a) - getReleaseTimestamp(b);
      case "most_listeners":
        return b.listenerCount - a.listenerCount;
      case "most_streams":
        return b.streamCount - a.streamCount;
      case "title_asc":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return sorted;
}

export function sortSongs(songs: Song[], sort: SongSortOption): Song[] {
  const sorted = [...songs];

  sorted.sort((a, b) => {
    switch (sort) {
      case "newest":
        return getReleaseTimestamp(b) - getReleaseTimestamp(a);
      case "oldest":
        return getReleaseTimestamp(a) - getReleaseTimestamp(b);
      case "most_listeners":
        return b.listenerCount - a.listenerCount;
      case "most_streams":
        return b.streamCount - a.streamCount;
      case "title_asc":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return sorted;
}

export function getAlbumSongs(album: Album, allSongs: Song[]): Song[] {
  return album.songIds
    .map((songId) => allSongs.find((song) => song.id === songId))
    .filter((song): song is Song => Boolean(song));
}

export function getSingleTracks(songs: Song[]): Song[] {
  return songs.filter((song) => !song.albumId);
}
