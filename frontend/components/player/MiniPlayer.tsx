"use client";

import { usePlayer } from "@/hooks/usePlayer";
import { NowPlayingInfo } from "@/components/player/NowPlayingInfo";
import { Button } from "@/components/ui/Button";

export function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    expandPlayer,
    togglePlay,
    playNext,
  } = usePlayer();

  if (!currentSong) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-default bg-bg-secondary md:hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <NowPlayingInfo
          song={currentSong}
          compact
          onExpand={expandPlayer}
          className="min-w-0 flex-1"
        />

        <Button variant="ghost" size="sm" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? "⏸" : "▶"}
        </Button>

        <Button variant="ghost" size="sm" onClick={playNext} aria-label="Next track">
          ⏭
        </Button>
      </div>
    </footer>
  );
}
