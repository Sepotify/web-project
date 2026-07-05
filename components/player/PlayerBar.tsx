"use client";

import { usePlayer } from "@/hooks/usePlayer";
import { NowPlayingInfo } from "@/components/player/NowPlayingInfo";
import { PlayerControls } from "@/components/player/PlayerControls";
import { ProgressBar } from "@/components/player/ProgressBar";
import { VolumeSlider } from "@/components/player/VolumeSlider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    shuffle,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    toggleQueue,
  } = usePlayer();

  if (!currentSong) return null;

  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 hidden border-t border-border-default bg-bg-secondary md:block",
      )}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 py-3">
        <NowPlayingInfo song={currentSong} className="w-72 shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <PlayerControls
            isPlaying={isPlaying}
            repeatMode={repeatMode}
            shuffle={shuffle}
            onTogglePlay={togglePlay}
            onPrevious={playPrevious}
            onNext={playNext}
            onToggleRepeat={toggleRepeat}
            onToggleShuffle={toggleShuffle}
            className="justify-center"
          />
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
          />
        </div>

        <div className="flex w-56 shrink-0 items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={toggleQueue} aria-label="Open queue">
            ☰
          </Button>
          <VolumeSlider volume={volume} onChange={setVolume} />
        </div>
      </div>
    </footer>
  );
}
