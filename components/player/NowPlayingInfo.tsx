"use client";

import { formatDuration, getDefaultCover, getSongMeta } from "@/lib/music";
import { cn } from "@/lib/utils";
import type { Song } from "@/types";
import Link from "next/link";

interface NowPlayingInfoProps {
  song: Song;
  compact?: boolean;
  onExpand?: () => void;
  className?: string;
}

export function NowPlayingInfo({
  song,
  compact = false,
  onExpand,
  className,
}: NowPlayingInfoProps) {
  const { artistName, albumTitle } = getSongMeta(song);
  const artistHref = `/artist/${song.artistId}`;
  const albumHref = song.albumId ? `/albums/${song.albumId}` : undefined;

  const cover = (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-md bg-bg-hover",
        compact ? "h-10 w-10" : "h-14 w-14",
      )}
      style={{ background: song.coverUrl ? undefined : getDefaultCover(song.title) }}
    >
      {song.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
          {song.title.slice(0, 1)}
        </div>
      )}
    </div>
  );

  const info = (
    <div className="min-w-0 flex-1">
      <p className={cn("truncate font-medium text-text-primary", compact ? "text-sm" : "text-base")}>
        {onExpand ? (
          <button type="button" onClick={onExpand} className="hover:underline">
            {song.title}
          </button>
        ) : (
          song.title
        )}
      </p>
      <p className="truncate text-xs text-text-muted sm:text-sm">
        <Link href={artistHref} className="hover:text-text-primary hover:underline">
          {artistName}
        </Link>
        {albumHref && albumTitle && (
          <>
            {" · "}
            <Link href={albumHref} className="hover:text-text-primary hover:underline">
              {albumTitle}
            </Link>
          </>
        )}
      </p>
      {!compact && (
        <p className="mt-0.5 text-xs text-text-muted">
          {formatDuration(song.durationSeconds)}
        </p>
      )}
    </div>
  );

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {cover}
      {info}
    </div>
  );
}
