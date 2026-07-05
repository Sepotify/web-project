"use client";

import { canViewGoldStats } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/AuthContext";
import type { Artist } from "@/types";

interface ArtistGoldStatsProps {
  artist: Artist;
  className?: string;
}

export function ArtistGoldStats({ artist, className }: ArtistGoldStatsProps) {
  const { user } = useAuth();

  if (!canViewGoldStats(user?.subscription)) return null;

  return (
    <section
      className={cn(
        "rounded-xl border border-border-default bg-bg-elevated p-5",
        className,
      )}
    >
      <h2 className="mb-3 text-sm font-semibold text-accent-primary">
        Gold listener stats
      </h2>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-text-muted">Total listeners</dt>
          <dd className="mt-1 text-2xl font-bold text-text-primary">
            {artist.totalListeners.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-text-muted">Total streams</dt>
          <dd className="mt-1 text-2xl font-bold text-text-primary">
            {artist.totalStreams.toLocaleString()}
          </dd>
        </div>
      </dl>
    </section>
  );
}
