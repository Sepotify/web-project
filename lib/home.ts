import { getAlbums } from "@/lib/storage";
import { sortAlbums } from "@/lib/library";
import type { Album } from "@/types";

export const HOME_ALBUM_LIMIT = 6;
export const HOME_PLAYLIST_LIMIT = 6;

export function getLatestAlbums(limit = HOME_ALBUM_LIMIT): Album[] {
  return sortAlbums(getAlbums(), "newest").slice(0, limit);
}
