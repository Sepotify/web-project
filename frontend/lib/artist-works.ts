export const ALLOWED_AUDIO_EXTENSIONS = [".flac", ".wav", ".mp3"] as const;

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/flac",
  "audio/x-flac",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
] as const;

export const ALLOWED_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_AUDIO_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_COVER_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  return index === -1 ? "" : fileName.slice(index).toLowerCase();
}

export function validateAudioFile(file: File): string | undefined {
  const extension = getFileExtension(file.name);

  if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension as (typeof ALLOWED_AUDIO_EXTENSIONS)[number])) {
    return "Audio must be FLAC, WAV, or MP3.";
  }

  if (
    file.type &&
    !ALLOWED_AUDIO_MIME_TYPES.includes(file.type as (typeof ALLOWED_AUDIO_MIME_TYPES)[number])
  ) {
    return "Unsupported audio format.";
  }

  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    return `Audio file must be ${formatFileSize(MAX_AUDIO_FILE_SIZE_BYTES)} or smaller.`;
  }

  return undefined;
}

export function validateCoverFile(file: File): string | undefined {
  if (!ALLOWED_COVER_MIME_TYPES.includes(file.type as (typeof ALLOWED_COVER_MIME_TYPES)[number])) {
    return "Cover must be a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_COVER_FILE_SIZE_BYTES) {
    return `Cover image must be ${formatFileSize(MAX_COVER_FILE_SIZE_BYTES)} or smaller.`;
  }

  return undefined;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read file."));
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export function getAudioDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();

    const cleanup = () => URL.revokeObjectURL(url);

    audio.addEventListener("loadedmetadata", () => {
      cleanup();
      resolve(Math.max(Math.round(audio.duration), 1));
    });

    audio.addEventListener("error", () => {
      cleanup();
      resolve(180);
    });

    audio.src = url;
  });
}
