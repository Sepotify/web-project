"use client";

import { formatDuration, getDefaultCover, getSongMeta } from "@/lib/music";
import { cn } from "@/lib/utils";
import type { Song } from "@/types";
import { Button } from "@/components/ui/Button";

interface SongCardProps {
  song: Song;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  compact?: boolean;
}

export function SongCard({
  song,
  actionLabel,
  onAction,
  actionDisabled = false,
  compact = false,
}: SongCardProps) {
  const { artistName, albumTitle } = getSongMeta(song);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border-default bg-bg-elevated p-3",
        compact && "p-2.5",
      )}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
        style={{ background: song.coverUrl ? undefined : getDefaultCover(song.title) }}
      >
        {song.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverUrl}
            alt={song.title}
            className="h-full w-full rounded-md object-cover"
          />
        ) : (
          song.title.slice(0, 1).toUpperCase()
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{song.title}</p>
        <p className="truncate text-xs text-text-muted">
          {artistName}
          {albumTitle ? ` · ${albumTitle}` : " · Single"}
        </p>
      </div>

      <span className="hidden shrink-0 text-xs text-text-muted sm:inline">
        {formatDuration(song.durationSeconds)}
      </span>

      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onAction}
          disabled={actionDisabled}
          className="shrink-0"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
