"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetchUser, mapApiUserToUser } from "@/lib/api/endpoints";
import { getUserById } from "@/lib/storage";
import type { User } from "@/types";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const apiUser = await apiFetchUser(userId);
      setProfile(mapApiUserToUser(apiUser));
    } catch {
      setProfile(getUserById(userId) ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, isLoading, refresh };
}
