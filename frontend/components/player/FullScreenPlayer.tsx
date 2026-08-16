"use client";

import { usePlayer } from "@/hooks/usePlayer";
import { NowPlayingInfo } from "@/components/player/NowPlayingInfo";
import { PlayerControls } from "@/components/player/PlayerControls";
import { PlayerExtras } from "@/components/player/PlayerExtras";
import { ProgressBar } from "@/components/player/ProgressBar";
import { VolumeSlider } from "@/components/player/VolumeSlider";
import { LyricsPanel } from "@/components/player/LyricsPanel";
import { GoldStats } from "@/components/player/GoldStats";
import { QueuePanel } from "@/components/player/QueuePanel";
import { Button } from "@/components/ui/Button";

export function FullScreenPlayer() {
  const {
    currentSong,
    isExpanded,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    shuffle,
    collapsePlayer,
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

  if (!currentSong || !isExpanded) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary md:hidden">
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <Button variant="ghost" size="sm" onClick={collapsePlayer} aria-label="Close player">
          ↓
        </Button>
        <p className="text-sm font-medium text-text-primary">Now playing</p>
        <Button variant="ghost" size="sm" onClick={toggleQueue} aria-label="Open queue">
          ☰
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <NowPlayingInfo song={currentSong} />

        <PlayerControls
          isPlaying={isPlaying}
          repeatMode={repeatMode}
          shuffle={shuffle}
          onTogglePlay={togglePlay}
          onPrevious={playPrevious}
          onNext={playNext}
          onToggleRepeat={toggleRepeat}
          onToggleShuffle={toggleShuffle}
          size="lg"
          className="justify-center"
        />

        <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />

        <div className="flex items-center justify-between gap-3">
          <VolumeSlider volume={volume} onChange={setVolume} />
          <PlayerExtras
            quality={quality}
            crossfadeEnabled={crossfadeEnabled}
            onToggleQuality={toggleQuality}
            onToggleCrossfade={toggleCrossfade}
          />
        </div>

        <GoldStats song={currentSong} />

        <LyricsPanel song={currentSong} className="min-h-[160px] flex-1" />
      </div>

      <QueuePanel className="bottom-0 right-0 max-h-[40vh] rounded-none border-x-0 border-b-0" />
    </div>
  );
}
