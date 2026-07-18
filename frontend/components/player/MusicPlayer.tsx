"use client";

import { PlayerBar } from "@/components/player/PlayerBar";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { FullScreenPlayer } from "@/components/player/FullScreenPlayer";
import { QueuePanel } from "@/components/player/QueuePanel";
import { usePlayer } from "@/hooks/usePlayer";

export function MusicPlayer() {
  const { currentSong } = usePlayer();

  if (!currentSong) return null;

  return (
    <>
      <PlayerBar />
      <MiniPlayer />
      <FullScreenPlayer />
      <QueuePanel />
    </>
  );
}
