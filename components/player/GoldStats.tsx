"use client";

import { useAuth } from "@/store/AuthContext";
import type { Song } from "@/types";
import { cn } from "@/lib/utils";

interface GoldStatsProps {
  song: Song;
  className?: string;
}

export function GoldStats({ song, className }: GoldStatsProps) {
  const { user } = useAuth();
  const isGold = user?.subscription === "gold";

  if (!isGold) return null;

  return (
    <div className={cn("rounded-lg border border-border-default bg-bg-elevated p-4", className)}>
      <h3 className="mb-2 text-sm font-semibold text-accent-primary">Gold listener stats</h3>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-text-muted">Listeners</dt>
          <dd className="font-semibold text-text-primary">
            {song.listenerCount.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Streams</dt>
          <dd className="font-semibold text-text-primary">
            {song.streamCount.toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
