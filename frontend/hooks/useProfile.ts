"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserById } from "@/lib/storage";
import type { User } from "@/types";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setProfile(getUserById(userId) ?? null);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, isLoading, refresh };
}
