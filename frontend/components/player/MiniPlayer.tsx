"use client";

import { usePlayer } from "@/hooks/usePlayer";
import { NowPlayingInfo } from "@/components/player/NowPlayingInfo";
import { Button } from "@/components/ui/Button";

export function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    expandPlayer,
    togglePlay,
    playNext,
  } = usePlayer();

  if (!currentSong) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-default bg-bg-secondary md:hidden">
      <div
        className="h-0.5 bg-bg-hover"
        aria-hidden="true"
      >
        <div
          className="h-full bg-[var(--player-accent,var(--color-accent-primary))]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <NowPlayingInfo
          song={currentSong}
          compact
          onExpand={expandPlayer}
          className="min-w-0 flex-1"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="text-[var(--player-accent,var(--color-accent-primary))]"
        >
          {isPlaying ? "⏸" : "▶"}
        </Button>

        <Button variant="ghost" size="sm" onClick={playNext} aria-label="Next track">
          ⏭
        </Button>
      </div>
    </footer>
  );
}
