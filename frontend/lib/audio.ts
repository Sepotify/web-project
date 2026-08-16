import type { Song } from "@/types";

const FALLBACK_AUDIO_URLS = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
];

const ALLOWED_PROXY_HOSTS = new Set(["localhost", "127.0.0.1", "www.soundhelix.com", "soundhelix.com"]);

export function getSongAudioUrl(song: Song): string {
  if (song.audioUrl) return song.audioUrl;

  const hash = song.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_AUDIO_URLS[hash % FALLBACK_AUDIO_URLS.length];
}

export function isPrivateLanHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!match) return false;
  const second = Number(match[1]);
  return second >= 16 && second <= 31;
}

export function canProxyMediaUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (ALLOWED_PROXY_HOSTS.has(parsed.hostname)) return true;
    return isPrivateLanHostname(parsed.hostname);
  } catch {
    return false;
  }
}

/** Same-origin wrapper so Web Audio / canvas can read cross-origin media. */
export function getPlayableMediaUrl(rawUrl: string): string {
  if (!rawUrl || typeof window === "undefined") return rawUrl;

  try {
    const parsed = new URL(rawUrl, window.location.href);
    if (parsed.origin === window.location.origin) return parsed.href;
    if (!canProxyMediaUrl(parsed.href)) return parsed.href;
    return `/api/media-proxy?url=${encodeURIComponent(parsed.href)}`;
  } catch {
    return rawUrl;
  }
}

export function getPlayableSongAudioUrl(song: Song): string {
  return getPlayableMediaUrl(getSongAudioUrl(song));
}
