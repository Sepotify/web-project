"use client";

import type { CSSProperties } from "react";
import { PlayerBar } from "@/components/player/PlayerBar";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { FullScreenPlayer } from "@/components/player/FullScreenPlayer";
import { QueuePanel } from "@/components/player/QueuePanel";
import { usePlayer } from "@/hooks/usePlayer";

export function MusicPlayer() {
  const { currentSong, accentColor, accentHover } = usePlayer();

  if (!currentSong) return null;

  const theme = {
    "--player-accent": accentColor,
    "--player-accent-hover": accentHover,
  } as CSSProperties;

  return (
    <div style={theme}>
      <PlayerBar />
      <MiniPlayer />
      <FullScreenPlayer />
      <QueuePanel />
    </div>
  );
}
