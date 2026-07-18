"use client";

import Link from "next/link";
import { getArtistName, getDefaultCover } from "@/lib/music";
import type { Album } from "@/types";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface AlbumCardProps {
  album: Album;
  className?: string;
}

export function AlbumCard({ album, className }: AlbumCardProps) {
  const artistName = getArtistName(album.artistId);

  return (
    <Card hoverable className={cn("flex h-full flex-col p-4", className)}>
      <Link href={`/albums/${album.id}`} className="block">
        <div
          className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-md text-2xl font-bold text-white"
          style={{ background: album.coverUrl ? undefined : getDefaultCover(album.title) }}
        >
          {album.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={album.coverUrl}
              alt={album.title}
              className="h-full w-full object-cover"
            />
          ) : (
            album.title.slice(0, 1)
          )}
        </div>

        <h3 className="truncate font-semibold text-text-primary hover:underline">
          {album.title}
        </h3>
      </Link>

      <Link
        href={`/artist/${album.artistId}`}
        className="mt-1 block truncate text-sm text-text-muted hover:text-text-primary hover:underline"
      >
        {artistName}
      </Link>

      <p className="mt-2 text-xs text-text-muted">
        {album.songIds.length} tracks
        {album.releaseYear ? ` · ${album.releaseYear}` : ""}
      </p>
    </Card>
  );
}
