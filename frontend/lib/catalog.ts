import { calculateArtistEarnings } from "@/lib/admin";
import { getArtistName } from "@/lib/music";
import {
  deleteAlbum,
  deleteSong,
  getAlbumById,
  getArtists,
  getPlaylists,
  getSongById,
  updateAlbum,
  updatePlaylist,
  updateSong,
} from "@/lib/storage";
import type { Album, Song } from "@/types";

export interface WorkStats {
  listeners: number;
  streams: number;
  earnings: number;
}

export function getSongStats(song: Song): WorkStats {
  return {
    listeners: song.listenerCount,
    streams: song.streamCount,
    earnings: calculateArtistEarnings(song.streamCount),
  };
}

export function getAlbumStats(album: Album): WorkStats {
  return {
    listeners: album.listenerCount,
    streams: album.streamCount,
    earnings: calculateArtistEarnings(album.streamCount),
  };
}

export function resolveFeaturedArtistIds(
  input: string,
  currentArtistId: string,
): string[] {
  const names = input
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length === 0) return [];

  const artists = getArtists().filter(
    (artist) => artist.id !== currentArtistId && artist.status === "approved",
  );

  const ids: string[] = [];
  for (const name of names) {
    const match = artists.find(
      (artist) => artist.stageName.toLowerCase() === name.toLowerCase(),
    );
    if (match) ids.push(match.id);
  }

  return ids;
}

export function formatFeaturedArtistNames(artistIds: string[]): string {
  return artistIds.map((id) => getArtistName(id)).join(", ");
}

function removeSongFromPlaylists(songId: string): void {
  for (const playlist of getPlaylists()) {
    if (!playlist.songIds.includes(songId)) continue;
    updatePlaylist(playlist.id, {
      songIds: playlist.songIds.filter((id) => id !== songId),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function deleteArtistSong(artistId: string, songId: string): boolean {
  const song = getSongById(songId);
  if (!song || song.artistId !== artistId) return false;

  if (song.albumId) {
    const album = getAlbumById(song.albumId);
    if (album) {
      const remainingSongIds = album.songIds.filter((id) => id !== songId);
      if (remainingSongIds.length === 0) {
        deleteAlbum(album.id);
      } else {
        updateAlbum(album.id, { songIds: remainingSongIds });
      }
    }
  }

  deleteSong(songId);
  removeSongFromPlaylists(songId);
  return true;
}

export function deleteArtistAlbum(artistId: string, albumId: string): boolean {
  const album = getAlbumById(albumId);
  if (!album || album.artistId !== artistId) return false;

  for (const songId of album.songIds) {
    deleteSong(songId);
    removeSongFromPlaylists(songId);
  }

  deleteAlbum(albumId);
  return true;
}

export interface UpdateSongInput {
  title: string;
  genre?: string;
  releaseYear?: number;
  lyrics?: string;
  featuredArtistIds: string[];
  coverUrl?: string;
  audioUrl?: string;
  durationSeconds?: number;
}

export function updateArtistSong(
  artistId: string,
  songId: string,
  input: UpdateSongInput,
): boolean {
  const song = getSongById(songId);
  if (!song || song.artistId !== artistId) return false;

  updateSong(songId, {
    title: input.title.trim(),
    genre: input.genre?.trim() || undefined,
    releaseYear: input.releaseYear,
    lyrics: input.lyrics?.trim() || undefined,
    featuredArtistIds: input.featuredArtistIds,
    coverUrl: input.coverUrl ?? song.coverUrl,
    audioUrl: input.audioUrl ?? song.audioUrl,
    durationSeconds: input.durationSeconds ?? song.durationSeconds,
  });

  return true;
}

export interface UpdateAlbumInput {
  title: string;
  genre?: string;
  releaseYear?: number;
  coverUrl?: string;
}

export function updateArtistAlbum(
  artistId: string,
  albumId: string,
  input: UpdateAlbumInput,
): boolean {
  const album = getAlbumById(albumId);
  if (!album || album.artistId !== artistId) return false;

  updateAlbum(albumId, {
    title: input.title.trim(),
    genre: input.genre?.trim() || undefined,
    releaseYear: input.releaseYear,
    coverUrl: input.coverUrl ?? album.coverUrl,
  });

  if (input.coverUrl) {
    for (const songId of album.songIds) {
      updateSong(songId, { coverUrl: input.coverUrl });
    }
  }

  return true;
}
