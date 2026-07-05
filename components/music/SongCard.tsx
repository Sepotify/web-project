"use client";

import Link from "next/link";
import { formatDuration, getDefaultCover, getSongMeta } from "@/lib/music";
import { PlaylistMenu } from "@/components/music/PlaylistMenu";
import { cn } from "@/lib/utils";
import type { Song, SubscriptionTier } from "@/types";
import { Button } from "@/components/ui/Button";

interface SongCardProps {
  song: Song;
  userId?: string;
  subscription?: SubscriptionTier;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  onPlay?: () => void;
  showPlaylistMenu?: boolean;
  compact?: boolean;
}

export function SongCard({
  song,
  userId,
  subscription,
  actionLabel,
  onAction,
  actionDisabled = false,
  onPlay,
  showPlaylistMenu = true,
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
      <button
        type="button"
        onClick={onPlay}
        disabled={!onPlay}
        aria-label={onPlay ? `Play ${song.title}` : undefined}
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs font-bold text-white",
          onPlay && "cursor-pointer hover:opacity-90",
          !onPlay && "cursor-default",
        )}
        style={{ background: song.coverUrl ? undefined : getDefaultCover(song.title) }}
      >
        {song.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverUrl}
            alt={song.title}
            className="h-full w-full object-cover"
          />
        ) : (
          song.title.slice(0, 1).toUpperCase()
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onPlay}
          disabled={!onPlay}
          className={cn(
            "block w-full truncate text-left text-sm font-medium text-text-primary",
            onPlay && "cursor-pointer hover:underline",
            !onPlay && "cursor-default",
          )}
        >
          {song.title}
        </button>

        <p className="truncate text-xs text-text-muted">
          <Link
            href={`/artist/${song.artistId}`}
            className="hover:text-text-primary hover:underline"
          >
            {artistName}
          </Link>
          {song.albumId && albumTitle ? (
            <>
              {" · "}
              <Link
                href={`/albums/${song.albumId}`}
                className="hover:text-text-primary hover:underline"
              >
                {albumTitle}
              </Link>
            </>
          ) : (
            " · Single"
          )}
        </p>
      </div>

      <span className="hidden shrink-0 text-xs text-text-muted sm:inline">
        {formatDuration(song.durationSeconds)}
      </span>

      {userId && showPlaylistMenu && subscription && (
        <PlaylistMenu song={song} userId={userId} subscription={subscription} />
      )}

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
