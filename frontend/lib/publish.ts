import { ApiError } from "@/lib/api/client";
import { addSong } from "@/lib/storage";
import { releaseAlbum, releaseSong } from "@/lib/releases";
import {
  getAudioDurationSeconds,
  readFileAsDataUrl,
  validateAudioFile,
  validateCoverFile,
} from "@/lib/artist-works";
import {
  mapApiAlbum,
  mapApiSong,
  resolveFeaturedArtistIds,
} from "@/lib/catalog";
import { validateRequired } from "@/lib/validation";
import type { Album, Song } from "@/types";

export type ReleaseType = "single" | "album";

export interface PublishTrackInput {
  title: string;
  lyrics: string;
  audioFile: File;
}

export interface PublishReleaseInput {
  releaseType: ReleaseType;
  title: string;
  genre: string;
  releaseYear: number;
  featuredArtists: string;
  coverFile: File;
  tracks: PublishTrackInput[];
}

export interface PublishReleaseErrors {
  title?: string;
  genre?: string;
  releaseYear?: string;
  featuredArtists?: string;
  coverFile?: string;
  tracks?: string;
  [trackKey: `track_${number}_title`]: string | undefined;
  [trackKey: `track_${number}_audio`]: string | undefined;
}

export interface PublishReleaseResult {
  success: boolean;
  song?: Song;
  album?: Album;
  errors?: PublishReleaseErrors;
  error?: string;
}

const MIN_RELEASE_YEAR = 1900;
const MAX_RELEASE_YEAR = 2100;

export function validatePublishReleaseInput(
  input: Partial<PublishReleaseInput>,
): PublishReleaseErrors {
  const errors: PublishReleaseErrors = {};

  const titleError = validateRequired(input.title ?? "", "Title");
  if (titleError) errors.title = titleError;

  const genreError = validateRequired(input.genre ?? "", "Genre");
  if (genreError) errors.genre = genreError;

  if (!input.releaseYear) {
    errors.releaseYear = "Release year is required.";
  } else if (
    input.releaseYear < MIN_RELEASE_YEAR ||
    input.releaseYear > MAX_RELEASE_YEAR
  ) {
    errors.releaseYear = `Release year must be between ${MIN_RELEASE_YEAR} and ${MAX_RELEASE_YEAR}.`;
  }

  if (!input.coverFile) {
    errors.coverFile = "Cover image is required.";
  } else {
    const coverError = validateCoverFile(input.coverFile);
    if (coverError) errors.coverFile = coverError;
  }

  const tracks = input.tracks ?? [];
  if (tracks.length === 0) {
    errors.tracks = "Add at least one track.";
  }

  tracks.forEach((track, index) => {
    const titleKey = `track_${index}_title` as const;
    const audioKey = `track_${index}_audio` as const;

    const trackTitleError = validateRequired(track.title, "Track title");
    if (trackTitleError) errors[titleKey] = trackTitleError;

    if (!track.audioFile) {
      errors[audioKey] = "Audio file is required.";
    } else {
      const audioError = validateAudioFile(track.audioFile);
      if (audioError) errors[audioKey] = audioError;
    }
  });

  return errors;
}

async function buildSongFromTrack(
  track: PublishTrackInput,
  options: {
    artistId: string;
    albumId?: string;
    coverUrl: string;
    genre?: string;
    releaseYear: number;
    featuredArtistIds: string[];
  },
): Promise<Song> {
  const [audioUrl, durationSeconds] = await Promise.all([
    readFileAsDataUrl(track.audioFile),
    getAudioDurationSeconds(track.audioFile),
  ]);

  return {
    id: crypto.randomUUID(),
    title: track.title.trim(),
    artistId: options.artistId,
    albumId: options.albumId,
    coverUrl: options.coverUrl,
    audioUrl,
    lyrics: track.lyrics.trim() || undefined,
    genre: options.genre,
    releaseYear: options.releaseYear,
    featuredArtistIds: options.featuredArtistIds,
    listenerCount: 0,
    streamCount: 0,
    durationSeconds,
    createdAt: new Date().toISOString(),
  };
}

async function publishReleaseViaApi(
  artistId: string,
  input: PublishReleaseInput,
): Promise<PublishReleaseResult> {
  const featuredArtistIds = resolveFeaturedArtistIds(input.featuredArtists, artistId);
  const { apiCreateAlbum, apiCreateSong } = await import("@/lib/api/endpoints");
  const { addAlbum } = await import("@/lib/storage");

  function appendFeatured(formData: FormData) {
    for (const id of featuredArtistIds) {
      formData.append("featured_artist_ids", id);
    }
  }

  if (input.releaseType === "single") {
    const track = input.tracks[0];
    const durationSeconds = await getAudioDurationSeconds(track.audioFile);
    const formData = new FormData();
    formData.append("title", input.title.trim());
    formData.append("genre", input.genre.trim());
    formData.append("release_year", String(input.releaseYear));
    formData.append("lyrics", track.lyrics.trim());
    formData.append("duration_seconds", String(durationSeconds));
    formData.append("audio", track.audioFile);
    formData.append("cover", input.coverFile);
    appendFeatured(formData);

    const data = await apiCreateSong(formData);
    const song = mapApiSong(data);
    addSong(song);
    return { success: true, song };
  }

  const albumForm = new FormData();
  albumForm.append("title", input.title.trim());
  albumForm.append("genre", input.genre.trim());
  albumForm.append("release_year", String(input.releaseYear));
  albumForm.append("cover", input.coverFile);
  const albumData = await apiCreateAlbum(albumForm);
  const album = mapApiAlbum(albumData);
  const songIds: string[] = [];

  for (const track of input.tracks) {
    const durationSeconds = await getAudioDurationSeconds(track.audioFile);
    const songForm = new FormData();
    songForm.append("title", track.title.trim());
    songForm.append("genre", input.genre.trim());
    songForm.append("release_year", String(input.releaseYear));
    songForm.append("lyrics", track.lyrics.trim());
    songForm.append("duration_seconds", String(durationSeconds));
    songForm.append("album", String(albumData.id));
    songForm.append("audio", track.audioFile);
    appendFeatured(songForm);

    const songData = await apiCreateSong(songForm);
    const song = mapApiSong(songData);
    addSong(song);
    songIds.push(song.id);
  }

  const savedAlbum = { ...album, songIds };
  addAlbum(savedAlbum);
  return { success: true, album: savedAlbum };
}

export async function publishRelease(
  artistId: string,
  input: PublishReleaseInput,
  useApi = false,
): Promise<PublishReleaseResult> {
  const errors = validatePublishReleaseInput(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  if (useApi) {
    try {
      return await publishReleaseViaApi(artistId, input);
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      // Fall through to localStorage if backend is unreachable.
    }
  }

  try {
    const coverUrl = await readFileAsDataUrl(input.coverFile);
    const featuredArtistIds = resolveFeaturedArtistIds(input.featuredArtists, artistId);
    const genre = input.genre.trim();

    if (input.releaseType === "single") {
      const song = await buildSongFromTrack(input.tracks[0], {
        artistId,
        coverUrl,
        genre,
        releaseYear: input.releaseYear,
        featuredArtistIds,
      });

      song.title = input.title.trim();
      releaseSong(song);
      return { success: true, song };
    }

    const albumId = crypto.randomUUID();
    const songIds: string[] = [];

    for (const track of input.tracks) {
      const song = await buildSongFromTrack(track, {
        artistId,
        albumId,
        coverUrl,
        genre,
        releaseYear: input.releaseYear,
        featuredArtistIds,
      });
      addSong(song);
      songIds.push(song.id);
    }

    const album: Album = {
      id: albumId,
      title: input.title.trim(),
      artistId,
      coverUrl,
      genre,
      releaseYear: input.releaseYear,
      songIds,
      listenerCount: 0,
      streamCount: 0,
      createdAt: new Date().toISOString(),
    };

    releaseAlbum(album);
    return { success: true, album };
  } catch {
    return {
      success: false,
      error: "Could not process the uploaded files. Try smaller files and publish again.",
    };
  }
}

// Backward-compatible alias for existing imports
export type PublishSingleInput = PublishReleaseInput;
export type PublishSingleErrors = PublishReleaseErrors;
export type PublishSingleResult = PublishReleaseResult;
export const validatePublishSingleInput = validatePublishReleaseInput;
export const publishSingle = publishRelease;
