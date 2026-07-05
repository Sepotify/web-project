"use client";

import { useEffect } from "react";
import {
  MOCK_SEED_DATA,
} from "@/lib/seed-data";
import { getSongs, getUsers, seedStorage } from "@/lib/storage";

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
      });
    }
  }, []);

  return children;
}
