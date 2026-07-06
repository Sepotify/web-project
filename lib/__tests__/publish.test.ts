import { describe, expect, it } from "vitest";
import {
  MAX_AUDIO_FILE_SIZE_BYTES,
  MAX_COVER_FILE_SIZE_BYTES,
  validateAudioFile,
  validateCoverFile,
} from "@/lib/artist-works";
import { validatePublishReleaseInput } from "@/lib/publish";

function createMockFile(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

const validCover = createMockFile("cover.jpg", "image/jpeg");
const validAudio = createMockFile("track.mp3", "audio/mpeg");

describe("validatePublishReleaseInput", () => {
  it("accepts a complete single release upload form", () => {
    const errors = validatePublishReleaseInput({
      releaseType: "single",
      title: "Midnight Drive",
      genre: "Electronic",
      releaseYear: 2026,
      featuredArtists: "Guest Artist",
      coverFile: validCover,
      tracks: [
        {
          title: "Midnight Drive",
          lyrics: "City lights fade away",
          audioFile: validAudio,
        },
      ],
    });

    expect(errors).toEqual({});
  });

  it("requires title, genre, release year, cover, and at least one track", () => {
    const errors = validatePublishReleaseInput({
      releaseType: "single",
      title: "",
      genre: "",
      releaseYear: undefined,
      featuredArtists: "",
      tracks: [],
    });

    expect(errors.title).toBe("Title is required.");
    expect(errors.genre).toBe("Genre is required.");
    expect(errors.releaseYear).toBe("Release year is required.");
    expect(errors.coverFile).toBe("Cover image is required.");
    expect(errors.tracks).toBe("Add at least one track.");
  });

  it("validates each track title and audio file", () => {
    const errors = validatePublishReleaseInput({
      releaseType: "album",
      title: "Collected Works",
      genre: "Pop",
      releaseYear: 2026,
      featuredArtists: "",
      coverFile: validCover,
      tracks: [
        {
          title: "",
          lyrics: "",
          audioFile: createMockFile("bad.txt", "text/plain"),
        },
      ],
    });

    expect(errors.track_0_title).toBe("Track title is required.");
    expect(errors.track_0_audio).toBe("Audio must be FLAC, WAV, or MP3.");
  });
});

describe("validateAudioFile", () => {
  it("accepts supported audio formats within the size limit", () => {
    expect(validateAudioFile(validAudio)).toBeUndefined();
    expect(validateAudioFile(createMockFile("track.flac", "audio/flac"))).toBeUndefined();
    expect(validateAudioFile(createMockFile("track.wav", "audio/wav"))).toBeUndefined();
  });

  it("rejects unsupported extensions and oversized files", () => {
    expect(validateAudioFile(createMockFile("track.ogg", "audio/ogg"))).toBe(
      "Audio must be FLAC, WAV, or MP3.",
    );
    expect(
      validateAudioFile(
        createMockFile("huge.mp3", "audio/mpeg", MAX_AUDIO_FILE_SIZE_BYTES + 1),
      ),
    ).toContain("or smaller.");
  });
});

describe("validateCoverFile", () => {
  it("accepts supported cover images within the size limit", () => {
    expect(validateCoverFile(validCover)).toBeUndefined();
    expect(validateCoverFile(createMockFile("cover.png", "image/png"))).toBeUndefined();
    expect(validateCoverFile(createMockFile("cover.webp", "image/webp"))).toBeUndefined();
  });

  it("rejects unsupported cover types and oversized images", () => {
    expect(validateCoverFile(createMockFile("cover.gif", "image/gif"))).toBe(
      "Cover must be a JPG, PNG, or WebP image.",
    );
    expect(
      validateCoverFile(
        createMockFile("huge.jpg", "image/jpeg", MAX_COVER_FILE_SIZE_BYTES + 1),
      ),
    ).toContain("or smaller.");
  });
});
