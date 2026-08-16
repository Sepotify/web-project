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
        type="button"
        variant={quality === "high" ? "primary" : "ghost"}
        size="sm"
        onClick={onToggleQuality}
        aria-label={getQualityLabel(quality)}
        aria-pressed={quality === "high"}
        className="min-w-[3.25rem] px-2 text-xs font-bold uppercase tracking-wide"
      >
        {quality === "high" ? "High" : "Low"}
      </Button>
      <Button
        type="button"
        variant={crossfadeEnabled ? "primary" : "ghost"}
        size="sm"
        onClick={onToggleCrossfade}
        aria-label={crossfadeEnabled ? "Disable crossfade" : "Enable crossfade"}
        aria-pressed={crossfadeEnabled}
        className="px-2 text-xs font-semibold"
      >
        {crossfadeEnabled ? "Fade on" : "Fade"}
      </Button>
    </div>
  );
}
