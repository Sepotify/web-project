import { getAlbumById, getArtistById } from "@/lib/storage";
import type { Song } from "@/types";

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getArtistName(artistId: string): string {
  return getArtistById(artistId)?.stageName ?? "Unknown artist";
}

export function getSongMeta(song: Song) {
  const artistName = getArtistName(song.artistId);
  const album = song.albumId ? getAlbumById(song.albumId) : undefined;

  return {
    artistName,
    albumTitle: album?.title,
  };
}

export function getDefaultCover(title: string): string {
  const hue = title.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${(hue + 40) % 360} 70% 25%))`;
}
