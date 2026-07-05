import type { Song } from "@/types";

const FALLBACK_AUDIO_URLS = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
];

export function getSongAudioUrl(song: Song): string {
  if (song.audioUrl) return song.audioUrl;

  const hash = song.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_AUDIO_URLS[hash % FALLBACK_AUDIO_URLS.length];
}
