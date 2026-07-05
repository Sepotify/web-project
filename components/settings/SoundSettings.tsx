"use client";

import {
  formatVolume,
  MAX_VOLUME,
  MIN_VOLUME,
  VOLUME_STEP,
} from "@/lib/settings";

interface SoundSettingsProps {
  defaultVolume: number;
  onChange: (volume: number) => void;
}

export function SoundSettings({ defaultVolume, onChange }: SoundSettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="default-volume" className="text-sm font-medium text-text-secondary">
            Default volume
          </label>
          <span className="text-sm font-semibold text-accent-primary">
            {formatVolume(defaultVolume)}
          </span>
        </div>
        <input
          id="default-volume"
          type="range"
          min={MIN_VOLUME}
          max={MAX_VOLUME}
          step={VOLUME_STEP}
          value={defaultVolume}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-bg-hover accent-accent-primary"
        />
      </div>
      <p className="text-xs text-text-muted">
        This volume level will be used as the default when the music player launches.
      </p>
    </div>
  );
}
