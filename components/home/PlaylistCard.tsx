"use client";

import { getDefaultCover } from "@/lib/music";
import { getSongById } from "@/lib/storage";
import { Card } from "@/components/ui/Card";
import type { Playlist } from "@/types";
import { cn } from "@/lib/utils";

interface PlaylistCardProps {
  playlist: Playlist;
  onPlay: () => void;
  className?: string;
}

export function PlaylistCard({ playlist, onPlay, className }: PlaylistCardProps) {
  const songs = playlist.songIds
    .map((songId) => getSongById(songId))
    .filter((song): song is NonNullable<typeof song> => Boolean(song));

  const coverSong = songs[0];
  const coverTitle = coverSong?.title ?? playlist.name;

  return (
    <Card
      hoverable
      className={cn("flex h-full flex-col p-4", className)}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPlay();
        }
      }}
      aria-label={`Play playlist ${playlist.name}`}
    >
      <div
        className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-md text-2xl font-bold text-white"
        style={{
          background: coverSong?.coverUrl
            ? undefined
            : getDefaultCover(coverTitle),
        }}
      >
        {coverSong?.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSong.coverUrl}
            alt={playlist.name}
            className="h-full w-full object-cover"
          />
        ) : (
          playlist.name.slice(0, 1).toUpperCase()
        )}
      </div>

      <h3 className="truncate font-semibold text-text-primary">{playlist.name}</h3>
      <p className="mt-1 text-sm text-text-muted">
        {songs.length} {songs.length === 1 ? "song" : "songs"}
      </p>
    </Card>
  );
}
