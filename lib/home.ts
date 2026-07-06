import { getAlbums, getSongs } from "@/lib/storage";
import { sortAlbums, sortSongs } from "@/lib/library";
import type { Album, Song } from "@/types";

export const HOME_ALBUM_LIMIT = 6;
export const HOME_PLAYLIST_LIMIT = 6;
export const HOME_SONG_LIMIT = 6;

export function getLatestAlbums(limit = HOME_ALBUM_LIMIT): Album[] {
  return sortAlbums(getAlbums(), "newest").slice(0, limit);
}

export function getPopularSongs(limit = HOME_SONG_LIMIT): Song[] {
  return sortSongs(getSongs(), "most_listeners").slice(0, limit);
}

export function getEarlyAccessSongs(): Song[] {
  return sortSongs(
    getSongs().filter((song) => song.isEarlyAccess),
    "newest",
  );
}
