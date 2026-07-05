import type { RepeatMode } from "@/types/player";
import type { Song } from "@/types";

const REPEAT_CYCLE: RepeatMode[] = ["off", "all", "one"];

export function cycleRepeatMode(current: RepeatMode): RepeatMode {
  const index = REPEAT_CYCLE.indexOf(current);
  return REPEAT_CYCLE[(index + 1) % REPEAT_CYCLE.length];
}

export function getRepeatModeLabel(mode: RepeatMode): string {
  switch (mode) {
    case "off":
      return "Repeat off";
    case "all":
      return "Repeat all";
    case "one":
      return "Repeat one";
  }
}

export function shuffleSongs(songs: Song[], currentIndex: number): Song[] {
  if (songs.length <= 1) return [...songs];

  const current = songs[currentIndex];
  const rest = songs.filter((_, index) => index !== currentIndex);
  const shuffledRest = shuffleArray(rest);

  return [current, ...shuffledRest];
}

export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function getNextIndex(
  currentIndex: number,
  queueLength: number,
  repeatMode: RepeatMode,
): number | null {
  if (queueLength === 0) return null;
  if (currentIndex < queueLength - 1) return currentIndex + 1;
  if (repeatMode === "all") return 0;
  if (repeatMode === "one") return currentIndex;
  return null;
}

export function getPreviousIndex(currentIndex: number, queueLength: number): number {
  if (queueLength === 0) return 0;
  if (currentIndex > 0) return currentIndex - 1;
  return queueLength - 1;
}

export function moveQueueItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function clampProgress(value: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(Math.max(value, 0), duration);
}
