import { describe, expect, it } from "vitest";
import {
  CROSSFADE_SECONDS,
  crossfadeVolumeFactors,
  getEffectiveDuration,
  getQualityCutoffHz,
  getRemainingTime,
  isAudioQuality,
  shouldStartCrossfade,
  toggleAudioQuality,
} from "@/lib/player-advanced";

describe("audio quality helpers", () => {
  it("accepts only low and high quality values", () => {
    expect(isAudioQuality("low")).toBe(true);
    expect(isAudioQuality("high")).toBe(true);
    expect(isAudioQuality("medium")).toBe(false);
  });

  it("uses a much lower cutoff for low quality so playback actually changes", () => {
    expect(getQualityCutoffHz("low")).toBeLessThan(getQualityCutoffHz("high"));
    expect(getQualityCutoffHz("low")).toBeLessThan(3000);
  });

  it("toggles between high and low", () => {
    expect(toggleAudioQuality("high")).toBe("low");
    expect(toggleAudioQuality("low")).toBe("high");
  });
});

describe("crossfade helpers", () => {
  it("starts in the last five seconds when a next track exists", () => {
    expect(
      shouldStartCrossfade({
        enabled: true,
        isAlreadyCrossfading: false,
        remaining: CROSSFADE_SECONDS,
        hasNextTrack: true,
      }),
    ).toBe(true);
  });

  it("does not start when the toggle is off or no next track exists", () => {
    expect(
      shouldStartCrossfade({
        enabled: false,
        isAlreadyCrossfading: false,
        remaining: 2,
        hasNextTrack: true,
      }),
    ).toBe(false);
    expect(
      shouldStartCrossfade({
        enabled: true,
        isAlreadyCrossfading: false,
        remaining: 2,
        hasNextTrack: false,
      }),
    ).toBe(false);
  });

  it("fades the current track out and the next track in over five seconds", () => {
    expect(crossfadeVolumeFactors(5)).toEqual({ outgoing: 1, incoming: 0 });
    expect(crossfadeVolumeFactors(2.5)).toEqual({ outgoing: 0.5, incoming: 0.5 });
    expect(crossfadeVolumeFactors(0)).toEqual({ outgoing: 0, incoming: 1 });
  });

  it("clamps remaining time to the track duration", () => {
    expect(getRemainingTime(10, 8)).toBe(0);
    expect(getRemainingTime(3, 10)).toBe(7);
  });

  it("falls back to song duration when Howler has not reported length yet", () => {
    expect(getEffectiveDuration(0, 180)).toBe(180);
    expect(getEffectiveDuration(Number.NaN, 180)).toBe(180);
    expect(getEffectiveDuration(367, 30)).toBe(367);
  });
});
