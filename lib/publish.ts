import { addSong } from "@/lib/storage";
import { releaseAlbum, releaseSong } from "@/lib/releases";
import {
  getAudioDurationSeconds,
  readFileAsDataUrl,
  validateAudioFile,
  validateCoverFile,
} from "@/lib/artist-works";
import { resolveFeaturedArtistIds } from "@/lib/catalog";
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

  const titleError = validateRequired(input.title, "Title");
  if (titleError) errors.title = titleError;

  const genreError = validateRequired(input.genre, "Genre");
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

export async function publishRelease(
  artistId: string,
  input: PublishReleaseInput,
): Promise<PublishReleaseResult> {
  const errors = validatePublishReleaseInput(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
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
