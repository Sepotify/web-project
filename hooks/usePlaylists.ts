"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlaylistsByUser } from "@/lib/storage";
import type { Playlist } from "@/types";

export function usePlaylists(userId: string | undefined) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!userId) {
      setPlaylists([]);
      setIsLoading(false);
      return;
    }

    setPlaylists(
      getPlaylistsByUser(userId).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { playlists, isLoading, refresh };
}
