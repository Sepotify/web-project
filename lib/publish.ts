import { releaseSong } from "@/lib/releases";
import {
  getAudioDurationSeconds,
  readFileAsDataUrl,
  validateAudioFile,
  validateCoverFile,
} from "@/lib/artist-works";
import { validateRequired } from "@/lib/validation";
import type { Song } from "@/types";

export interface PublishSingleInput {
  title: string;
  lyrics: string;
  audioFile: File;
  coverFile: File;
}

export interface PublishSingleErrors {
  title?: string;
  lyrics?: string;
  audioFile?: string;
  coverFile?: string;
}

export interface PublishSingleResult {
  success: boolean;
  song?: Song;
  errors?: PublishSingleErrors;
  error?: string;
}

export function validatePublishSingleInput(
  input: Partial<PublishSingleInput>,
): PublishSingleErrors {
  const errors: PublishSingleErrors = {};

  const titleError = validateRequired(input.title, "Title");
  if (titleError) errors.title = titleError;

  if (!input.audioFile) {
    errors.audioFile = "Audio file is required.";
  } else {
    const audioError = validateAudioFile(input.audioFile);
    if (audioError) errors.audioFile = audioError;
  }

  if (!input.coverFile) {
    errors.coverFile = "Cover image is required.";
  } else {
    const coverError = validateCoverFile(input.coverFile);
    if (coverError) errors.coverFile = coverError;
  }

  return errors;
}

export async function publishSingle(
  artistId: string,
  input: PublishSingleInput,
): Promise<PublishSingleResult> {
  const errors = validatePublishSingleInput(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  try {
    const [audioUrl, coverUrl, durationSeconds] = await Promise.all([
      readFileAsDataUrl(input.audioFile),
      readFileAsDataUrl(input.coverFile),
      getAudioDurationSeconds(input.audioFile),
    ]);

    const now = new Date().toISOString();
    const song: Song = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      artistId,
      coverUrl,
      audioUrl,
      lyrics: input.lyrics.trim() || undefined,
      releaseYear: new Date().getFullYear(),
      featuredArtistIds: [],
      listenerCount: 0,
      streamCount: 0,
      durationSeconds,
      createdAt: now,
    };

    releaseSong(song);
    return { success: true, song };
  } catch {
    return {
      success: false,
      error: "Could not process the uploaded files. Try smaller files and publish again.",
    };
  }
}
