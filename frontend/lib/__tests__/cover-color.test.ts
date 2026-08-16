import { describe, expect, it } from "vitest";
import {
  accentFromSeed,
  averageRgb,
  extractDominantColorFromImageData,
  hslToRgb,
  mixWithWhite,
  rgbToCss,
} from "@/lib/cover-color";
import { canProxyMediaUrl, getSongAudioUrl } from "@/lib/audio";
import type { Song } from "@/types";

function createSong(id: string, audioUrl?: string): Song {
  return {
    id,
    title: id,
    artistId: "artist-1",
    featuredArtistIds: [],
    listenerCount: 0,
    streamCount: 0,
    durationSeconds: 180,
    createdAt: "2024-01-01T00:00:00.000Z",
    audioUrl,
  };
}

describe("cover color helpers", () => {
  it("builds a stable accent from the cover seed", () => {
    expect(rgbToCss(accentFromSeed("Midnight"))).toBe(rgbToCss(accentFromSeed("Midnight")));
    expect(rgbToCss(accentFromSeed("Midnight"))).not.toBe(rgbToCss(accentFromSeed("Sunrise")));
  });

  it("converts hsl into css rgb", () => {
    const green = hslToRgb(120, 1, 0.5);
    expect(rgbToCss(green)).toBe("rgb(0 255 0)");
  });

  it("averages colorful pixels and ignores near-black/white", () => {
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 255,
      255, 255, 255, 255,
      40, 120, 200, 255,
      50, 130, 210, 255,
    ]);
    const color = averageRgb(pixels);
    expect(color?.r).toBeCloseTo(45);
    expect(color?.g).toBeCloseTo(125);
    expect(color?.b).toBeCloseTo(205);
  });

  it("reads dominant color from image data", () => {
    const imageData = {
      data: new Uint8ClampedArray([80, 10, 10, 255, 90, 20, 20, 255]),
      width: 2,
      height: 1,
      colorSpace: "srgb",
    } as ImageData;
    const color = extractDominantColorFromImageData(imageData);
    expect(color?.r).toBeCloseTo(85);
  });

  it("lightens the accent for hover states", () => {
    const mixed = mixWithWhite({ r: 0, g: 0, b: 0 }, 0.2);
    expect(mixed.r).toBeCloseTo(51);
  });
});

describe("playable audio urls", () => {
  it("uses the song file when present", () => {
    expect(getSongAudioUrl(createSong("a", "http://127.0.0.1:8000/media/audio/a.mp3"))).toBe(
      "http://127.0.0.1:8000/media/audio/a.mp3",
    );
  });

  it("allows proxying local and sandbox audio hosts", () => {
    expect(canProxyMediaUrl("http://127.0.0.1:8000/media/audio/a.mp3")).toBe(true);
    expect(canProxyMediaUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")).toBe(
      true,
    );
    expect(canProxyMediaUrl("https://evil.example/audio.mp3")).toBe(false);
  });
});
