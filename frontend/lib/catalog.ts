import { ApiError } from "@/lib/api/client";
import {
  apiDeleteAlbum,
  apiDeleteSong,
  apiFetchMyWorks,
  apiPublishRelease,
  apiUpdateAlbum,
  apiUpdateSong,
  type ApiAlbum,
  type ApiSong,
} from "@/lib/api/endpoints";
import { calculateArtistEarnings } from "@/lib/admin";
import { getArtistName } from "@/lib/music";
import {
  addAlbum,
  addSong,
  deleteAlbum,
  deleteSong,
  getAlbumById,
  getAlbums,
  getArtists,
  getPlaylists,
  getSongById,
  getSongs,
  updateAlbum,
  updatePlaylist,
  updateSong,
} from "@/lib/storage";
import type { Album, Song } from "@/types";
import type { ArtistDiscography } from "@/lib/artist";

export interface WorkStats {
  listeners: number;
  streams: number;
  earnings: number;
}

export function mapApiSong(song: ApiSong): Song {
  return {
    id: String(song.id),
    title: song.title,
    artistId: String(song.artist_id),
    albumId: song.album_id != null ? String(song.album_id) : undefined,
    coverUrl: song.cover_url ?? undefined,
    audioUrl: song.audio_url ?? undefined,
    lyrics: song.lyrics || undefined,
    genre: song.genre || undefined,
    releaseYear: song.release_year,
    featuredArtistIds: (song.featured_artist_ids ?? []).map(String),
    listenerCount: song.listener_count,
    streamCount: song.stream_count,
    durationSeconds: song.duration_seconds,
    isEarlyAccess: song.is_early_access,
    createdAt: song.created_at,
  };
}

export function mapApiAlbum(album: ApiAlbum): Album {
  return {
    id: String(album.id),
    title: album.title,
    artistId: String(album.artist_id),
    coverUrl: album.cover_url ?? undefined,
    genre: album.genre || undefined,
    releaseYear: album.release_year,
    songIds: (album.song_ids ?? []).map(String),
    listenerCount: album.listener_count,
    streamCount: album.stream_count,
    createdAt: album.created_at,
  };
}

function upsertSongLocally(song: Song): void {
  if (getSongById(song.id)) {
    updateSong(song.id, song);
  } else {
    addSong(song);
  }
}

function upsertAlbumLocally(album: Album): void {
  if (getAlbumById(album.id)) {
    updateAlbum(album.id, album);
  } else {
    addAlbum(album);
  }
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

export async function deleteArtistSongRequest(
  artistId: string,
  songId: string,
  useApi: boolean,
): Promise<boolean> {
  if (useApi) {
    try {
      await apiDeleteSong(songId);
      deleteArtistSong(artistId, songId);
      return true;
    } catch (error) {
      if (error instanceof ApiError) return false;
    }
  }
  return deleteArtistSong(artistId, songId);
}

export async function deleteArtistAlbumRequest(
  artistId: string,
  albumId: string,
  useApi: boolean,
): Promise<boolean> {
  if (useApi) {
    try {
      await apiDeleteAlbum(albumId);
      deleteArtistAlbum(artistId, albumId);
      return true;
    } catch (error) {
      if (error instanceof ApiError) return false;
    }
  }
  return deleteArtistAlbum(artistId, albumId);
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
  coverFile?: File | null;
  audioFile?: File | null;
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
  coverFile?: File | null;
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

export async function updateArtistSongRequest(
  artistId: string,
  songId: string,
  input: UpdateSongInput,
  useApi: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (useApi) {
    try {
      const formData = new FormData();
      formData.append("title", input.title.trim());
      if (input.genre !== undefined) formData.append("genre", input.genre.trim());
      if (input.releaseYear !== undefined) {
        formData.append("release_year", String(input.releaseYear));
      }
      if (input.lyrics !== undefined) formData.append("lyrics", input.lyrics);
      formData.append("featured_artist_ids", input.featuredArtistIds.join(","));
      if (input.durationSeconds !== undefined) {
        formData.append("duration_seconds", String(input.durationSeconds));
      }
      if (input.coverFile) formData.append("cover", input.coverFile);
      if (input.audioFile) formData.append("audio", input.audioFile);

      const data = await apiUpdateSong(songId, formData);
      const mapped = mapApiSong(data);
      upsertSongLocally(mapped);
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
    }
  }

  const saved = updateArtistSong(artistId, songId, input);
  return saved
    ? { success: true }
    : { success: false, error: "Could not update this track." };
}

export async function updateArtistAlbumRequest(
  artistId: string,
  albumId: string,
  input: UpdateAlbumInput,
  useApi: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (useApi) {
    try {
      const formData = new FormData();
      formData.append("title", input.title.trim());
      if (input.genre !== undefined) formData.append("genre", input.genre.trim());
      if (input.releaseYear !== undefined) {
        formData.append("release_year", String(input.releaseYear));
      }
      if (input.coverFile) formData.append("cover", input.coverFile);

      const data = await apiUpdateAlbum(albumId, formData);
      const mapped = mapApiAlbum(data);
      upsertAlbumLocally(mapped);
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
    }
  }

  const saved = updateArtistAlbum(artistId, albumId, input);
  return saved
    ? { success: true }
    : { success: false, error: "Could not update this album." };
}

export async function fetchArtistDiscography(
  artistId: string,
  useApi: boolean,
): Promise<ArtistDiscography> {
  if (!useApi) {
    const { getArtistDiscography } = await import("@/lib/artist");
    return getArtistDiscography(artistId);
  }

  try {
    const data = await apiFetchMyWorks();
    const albums = data.albums.map((album) => {
      const mapped = mapApiAlbum(album);
      upsertAlbumLocally(mapped);
      for (const song of album.songs ?? []) {
        upsertSongLocally(mapApiSong(song));
      }
      return mapped;
    });

    const albumSongIds = new Set(albums.flatMap((album) => album.songIds));
    const singles = data.songs
      .map(mapApiSong)
      .filter((song) => !song.albumId && !albumSongIds.has(song.id));

    for (const song of singles) {
      upsertSongLocally(song);
    }

    return { albums, singles };
  } catch {
    const { getArtistDiscography } = await import("@/lib/artist");
    return getArtistDiscography(artistId);
  }
}

export function getLocalCatalogSnapshot(artistId: string): {
  albums: Album[];
  songs: Song[];
} {
  return {
    albums: getAlbums().filter((album) => album.artistId === artistId),
    songs: getSongs().filter((song) => song.artistId === artistId),
  };
}

export { apiPublishRelease, mapApiSong as mapSongFromApi, mapApiAlbum as mapAlbumFromApi };
