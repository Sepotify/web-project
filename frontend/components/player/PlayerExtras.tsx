"use client";

import { getQualityLabel, type AudioQuality } from "@/lib/player-advanced";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface PlayerExtrasProps {
  quality: AudioQuality;
  crossfadeEnabled: boolean;
  onToggleQuality: () => void;
  onToggleCrossfade: () => void;
  compact?: boolean;
}

export function PlayerExtras({
  quality,
  crossfadeEnabled,
  onToggleQuality,
  onToggleCrossfade,
  compact = false,
}: PlayerExtrasProps) {
  return (
    <div className={cn("flex items-center gap-1", compact && "scale-90")}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleQuality}
        aria-label={getQualityLabel(quality)}
        aria-pressed={quality === "high"}
        className={cn(
          "min-w-[2.5rem] px-2 text-xs font-bold uppercase tracking-wide",
          quality === "high"
            ? "text-[var(--player-accent,var(--color-accent-primary))]"
            : "text-text-muted",
        )}
      >
        {quality === "high" ? "High" : "Low"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleCrossfade}
        aria-label={crossfadeEnabled ? "Disable crossfade" : "Enable crossfade"}
        aria-pressed={crossfadeEnabled}
        className={cn(
          "px-2 text-xs font-semibold",
          crossfadeEnabled
            ? "text-[var(--player-accent,var(--color-accent-primary))]"
            : "text-text-muted",
        )}
      >
        Fade
      </Button>
    </div>
  );
}
