"use client";

import type { Artist } from "@/types";
import { VerifiedBadge } from "@/components/artist/VerifiedBadge";
import { FollowArtistButton } from "@/components/artist/FollowArtistButton";
import { getDefaultCover } from "@/lib/music";
import { getArtistProfileSummary } from "@/lib/artist";
import { cn } from "@/lib/utils";

interface ArtistHeaderProps {
  artist: Artist;
  viewerUserId?: string;
  onFollowChange?: () => void;
  className?: string;
}

export function ArtistHeader({
  artist,
  viewerUserId,
  onFollowChange,
  className,
}: ArtistHeaderProps) {
  const { albumCount, singleCount, isApproved } = getArtistProfileSummary(artist);

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border-default bg-bg-elevated p-5 sm:flex-row sm:items-start sm:gap-6",
        className,
      )}
    >
      <div
        className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white sm:h-40 sm:w-40"
        style={{ background: getDefaultCover(artist.stageName) }}
      >
        {artist.stageName.slice(0, 1)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            {artist.stageName}
          </h1>
          {artist.isVerified && isApproved && <VerifiedBadge />}
        </div>

        <p className="mt-2 text-sm text-text-muted">
          {albumCount} {albumCount === 1 ? "album" : "albums"}
          {" · "}
          {singleCount} {singleCount === 1 ? "single" : "singles"}
        </p>

        {artist.bio ? (
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">{artist.bio}</p>
        ) : (
          <p className="mt-4 text-sm text-text-muted">No biography available yet.</p>
        )}

        {viewerUserId && (
          <div className="mt-5">
            <FollowArtistButton
              artistId={artist.id}
              viewerUserId={viewerUserId}
              onChange={onFollowChange}
            />
          </div>
        )}
      </div>
    </section>
  );
}
