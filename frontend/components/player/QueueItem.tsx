"use client";

import { formatDuration, getSongMeta } from "@/lib/music";
import { cn } from "@/lib/utils";
import type { Song } from "@/types";
import { Button } from "@/components/ui/Button";

interface QueueItemProps {
  song: Song;
  index: number;
  isCurrent: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function QueueItem({
  song,
  index,
  isCurrent,
  onPlay,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QueueItemProps) {
  const { artistName } = getSongMeta(song);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-border-default p-2",
        isCurrent ? "bg-bg-hover border-accent-primary/40" : "bg-bg-elevated",
      )}
    >
      <span className="w-5 text-center text-xs text-text-muted">{index + 1}</span>

      <button
        type="button"
        onClick={onPlay}
        className="min-w-0 flex-1 text-left"
        aria-label={`Play ${song.title}`}
      >
        <p className="truncate text-sm font-medium text-text-primary">{song.title}</p>
        <p className="truncate text-xs text-text-muted">{artistName}</p>
      </button>

      <span className="hidden text-xs text-text-muted sm:inline">
        {formatDuration(song.durationSeconds)}
      </span>

      <div className="flex items-center gap-1">
        {onMoveUp && (
          <Button variant="ghost" size="sm" onClick={onMoveUp} aria-label="Move up">
            ↑
          </Button>
        )}
        {onMoveDown && (
          <Button variant="ghost" size="sm" onClick={onMoveDown} aria-label="Move down">
            ↓
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Remove from queue">
          ✕
        </Button>
      </div>
    </div>
  );
}
