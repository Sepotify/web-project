"use client";

import { getRepeatModeLabel } from "@/lib/player-utils";
import type { RepeatMode } from "@/types/player";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PlayerControlsProps {
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PlayerControls({
  isPlaying,
  repeatMode,
  shuffle,
  onTogglePlay,
  onPrevious,
  onNext,
  onToggleRepeat,
  onToggleShuffle,
  size = "md",
  className,
}: PlayerControlsProps) {
  const iconSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleShuffle}
        aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
        aria-pressed={shuffle}
        className={cn(shuffle && "text-[var(--player-accent,var(--color-accent-primary))]")}
      >
        <span className={iconSize}>🔀</span>
      </Button>

      <Button variant="ghost" size="sm" onClick={onPrevious} aria-label="Previous track">
        <span className={iconSize}>⏮</span>
      </Button>

      <Button
        variant="primary"
        size={size === "lg" ? "lg" : "md"}
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="rounded-full px-4 bg-[var(--player-accent,var(--color-accent-primary))] hover:bg-[var(--player-accent-hover,var(--color-accent-primary-hover))]"
      >
        <span className={size === "lg" ? "text-2xl" : "text-xl"}>
          {isPlaying ? "⏸" : "▶"}
        </span>
      </Button>

      <Button variant="ghost" size="sm" onClick={onNext} aria-label="Next track">
        <span className={iconSize}>⏭</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleRepeat}
        aria-label={getRepeatModeLabel(repeatMode)}
        aria-pressed={repeatMode !== "off"}
        className={cn(repeatMode !== "off" && "text-[var(--player-accent,var(--color-accent-primary))]")}
      >
        <span className={iconSize}>
          {repeatMode === "one" ? "🔂" : "🔁"}
        </span>
      </Button>
    </div>
  );
}
