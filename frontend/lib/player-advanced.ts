export type AudioQuality = "low" | "high";

export const CROSSFADE_SECONDS = 5;
export const LOW_QUALITY_CUTOFF_HZ = 1800;
export const HIGH_QUALITY_CUTOFF_HZ = 18000;

const PLAYER_ADVANCED_KEY = "mock_spotify_player_advanced";

export interface PlayerAdvancedSettings {
  quality: AudioQuality;
  crossfadeEnabled: boolean;
}

const DEFAULT_ADVANCED: PlayerAdvancedSettings = {
  quality: "high",
  crossfadeEnabled: false,
};

export function isAudioQuality(value: unknown): value is AudioQuality {
  return value === "low" || value === "high";
}

export function getQualityCutoffHz(quality: AudioQuality): number {
  return quality === "low" ? LOW_QUALITY_CUTOFF_HZ : HIGH_QUALITY_CUTOFF_HZ;
}

export function getQualityLabel(quality: AudioQuality): string {
  return quality === "low" ? "Low quality" : "High quality";
}

export function toggleAudioQuality(current: AudioQuality): AudioQuality {
  return current === "high" ? "low" : "high";
}

export function getRemainingTime(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  if (!Number.isFinite(currentTime)) return duration;
  return Math.max(0, duration - currentTime);
}

export function getEffectiveDuration(howlDuration: number, songDuration: number): number {
  if (Number.isFinite(howlDuration) && howlDuration > 1) return howlDuration;
  if (Number.isFinite(songDuration) && songDuration > 0) return songDuration;
  return 0;
}

export function shouldStartCrossfade(options: {
  enabled: boolean;
  isAlreadyCrossfading: boolean;
  remaining: number;
  hasNextTrack: boolean;
}): boolean {
  return (
    options.enabled &&
    !options.isAlreadyCrossfading &&
    options.hasNextTrack &&
    options.remaining > 0 &&
    options.remaining <= CROSSFADE_SECONDS
  );
}

/** Linear fade over the last `windowSeconds` of the outgoing track. */
export function crossfadeVolumeFactors(
  remaining: number,
  windowSeconds = CROSSFADE_SECONDS,
): { outgoing: number; incoming: number } {
  if (windowSeconds <= 0) {
    return { outgoing: 0, incoming: 1 };
  }

  const progress = Math.min(Math.max(1 - remaining / windowSeconds, 0), 1);
  return {
    outgoing: 1 - progress,
    incoming: progress,
  };
}

export function readPlayerAdvancedSettings(): PlayerAdvancedSettings {
  if (typeof window === "undefined") return DEFAULT_ADVANCED;

  try {
    const raw = window.localStorage.getItem(PLAYER_ADVANCED_KEY);
    if (!raw) return DEFAULT_ADVANCED;

    const parsed = JSON.parse(raw) as Partial<PlayerAdvancedSettings>;
    return {
      quality: isAudioQuality(parsed.quality) ? parsed.quality : DEFAULT_ADVANCED.quality,
      crossfadeEnabled: Boolean(parsed.crossfadeEnabled),
    };
  } catch {
    return DEFAULT_ADVANCED;
  }
}

export function writePlayerAdvancedSettings(settings: PlayerAdvancedSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAYER_ADVANCED_KEY, JSON.stringify(settings));
}
