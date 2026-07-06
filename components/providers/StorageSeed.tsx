"use client";

import { useEffect } from "react";
import {
  MOCK_SEED_DATA,
} from "@/lib/seed-data";
import { runNotificationChecks } from "@/lib/notification-sync";
import {
  addSong,
  getNotifications,
  getRecentPlaylistPlays,
  getSongById,
  getSongs,
  getSubscriptions,
  getUsers,
  seedStorage,
  updateSong,
} from "@/lib/storage";

function syncSeedSongs(): void {
  const seedSongs = MOCK_SEED_DATA.songs ?? [];
  if (seedSongs.length === 0) return;

  for (const seedSong of seedSongs) {
    const existing = getSongById(seedSong.id);
    if (!existing) {
      addSong(seedSong);
      continue;
    }

    if (seedSong.isEarlyAccess && !existing.isEarlyAccess) {
      updateSong(seedSong.id, { isEarlyAccess: true });
    }
  }
}

export function StorageSeed({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (getUsers().length === 0) {
      seedStorage(MOCK_SEED_DATA);
      return;
    }

    if (getSongs().length === 0) {
      seedStorage({
        artists: MOCK_SEED_DATA.artists,
        albums: MOCK_SEED_DATA.albums,
        songs: MOCK_SEED_DATA.songs,
        playlists: MOCK_SEED_DATA.playlists,
        recentPlaylistPlays: MOCK_SEED_DATA.recentPlaylistPlays,
      });
      return;
    }

    syncSeedSongs();

    if (
      getRecentPlaylistPlays().length === 0 &&
      MOCK_SEED_DATA.recentPlaylistPlays?.length
    ) {
      seedStorage({ recentPlaylistPlays: MOCK_SEED_DATA.recentPlaylistPlays });
    }

    if (getNotifications().length === 0 && MOCK_SEED_DATA.notifications?.length) {
      seedStorage({ notifications: MOCK_SEED_DATA.notifications });
    }

    if (getSubscriptions().length === 0 && MOCK_SEED_DATA.subscriptions?.length) {
      seedStorage({ subscriptions: MOCK_SEED_DATA.subscriptions });
    }

    runNotificationChecks();
  }, []);

  return children;
}
