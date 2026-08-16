"use client";

import { useState } from "react";
import { GoldStats } from "@/components/player/GoldStats";
import { LyricsPanel } from "@/components/player/LyricsPanel";
import { NowPlayingInfo } from "@/components/player/NowPlayingInfo";
import { PlayerControls } from "@/components/player/PlayerControls";
import { PlayerExtras } from "@/components/player/PlayerExtras";
import { ProgressBar } from "@/components/player/ProgressBar";
import { VolumeSlider } from "@/components/player/VolumeSlider";
import { Button } from "@/components/ui/Button";
import { usePlayer } from "@/hooks/usePlayer";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const [detailsOpen, setDetailsOpen] = useState(false);
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
    quality,
    crossfadeEnabled,
    toggleQuality,
    toggleCrossfade,
  } = usePlayer();

  if (!currentSong) return null;

  return (
    <>
      {detailsOpen ? (
        <div className="fixed bottom-[88px] left-4 right-4 z-50 hidden max-h-[45vh] flex-col gap-3 overflow-y-auto rounded-xl border border-border-default bg-bg-secondary p-4 shadow-lg md:flex md:left-auto md:max-w-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Track details</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailsOpen(false)}
              aria-label="Close track details"
            >
              ✕
            </Button>
          </div>
          <GoldStats song={currentSong} />
          <LyricsPanel song={currentSong} className="min-h-[120px]" />
        </div>
      ) : null}

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

          <div className="flex w-72 shrink-0 items-center justify-end gap-2">
            <PlayerExtras
              quality={quality}
              crossfadeEnabled={crossfadeEnabled}
              onToggleQuality={toggleQuality}
              onToggleCrossfade={toggleCrossfade}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailsOpen((open) => !open)}
              aria-label="Toggle track details"
              aria-pressed={detailsOpen}
            >
              ℹ
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleQueue} aria-label="Open queue">
              ☰
            </Button>
            <VolumeSlider volume={volume} onChange={setVolume} />
          </div>
        </div>
      </footer>
    </>
  );
}
