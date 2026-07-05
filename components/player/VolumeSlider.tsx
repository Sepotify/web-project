"use client";

import { MAX_VOLUME, MIN_VOLUME, VOLUME_STEP } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface VolumeSliderProps {
  volume: number;
  onChange: (volume: number) => void;
  className?: string;
  compact?: boolean;
}

export function VolumeSlider({
  volume,
  onChange,
  className,
  compact = false,
}: VolumeSliderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-text-secondary" aria-hidden="true">
        {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
      </span>
      <input
        type="range"
        min={MIN_VOLUME}
        max={MAX_VOLUME}
        step={VOLUME_STEP}
        value={volume}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Volume"
        className={cn(
          "cursor-pointer appearance-none rounded-full bg-bg-hover accent-accent-primary",
          compact ? "h-1.5 w-20" : "h-2 w-24",
        )}
      />
    </div>
  );
}
