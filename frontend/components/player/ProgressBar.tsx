"use client";

import { clampProgress } from "@/lib/player-utils";
import { formatDuration } from "@/lib/music";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

export function ProgressBar({
  currentTime,
  duration,
  onSeek,
  className,
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || duration <= 0) return;

      const rect = track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const nextTime = clampProgress(ratio * duration, duration);
      onSeek(nextTime);
    },
    [duration, onSeek],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    seekFromClientX(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="w-10 text-right text-xs text-text-muted">
        {formatDuration(Math.floor(currentTime))}
      </span>

      <div
        ref={trackRef}
        role="slider"
        aria-label="Seek track"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        className="group relative h-1 flex-1 cursor-pointer rounded-full bg-bg-hover"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--player-accent,var(--color-accent-primary))]"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `calc(${Math.min(100, Math.max(0, progress))}% - 6px)` }}
        />
      </div>

      <span className="w-10 text-xs text-text-muted">
        {formatDuration(Math.floor(duration))}
      </span>
    </div>
  );
}
