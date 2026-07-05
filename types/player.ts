import type { Song } from "@/types";

export type RepeatMode = "off" | "all" | "one";

export interface PlayerQueueItem {
  song: Song;
  queueIndex: number;
}

export interface PlayerSnapshot {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  isQueueOpen: boolean;
  isExpanded: boolean;
}
