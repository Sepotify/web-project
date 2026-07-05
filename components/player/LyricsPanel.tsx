"use client";

import type { Song } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface LyricsPanelProps {
  song: Song;
  className?: string;
}

export function LyricsPanel({ song, className }: LyricsPanelProps) {
  if (!song.lyrics?.trim()) {
    return (
      <EmptyState
        title="No lyrics available"
        description="Lyrics have not been added for this track yet."
        icon="🎵"
        className={className}
      />
    );
  }

  return (
    <div className={cn("overflow-y-auto rounded-lg border border-border-default bg-bg-elevated p-4", className)}>
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Lyrics</h3>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-secondary">
        {song.lyrics}
      </pre>
    </div>
  );
}
