"use client";

import { useCallback, useEffect, useState } from "react";
import { getAppSettings, updateAppSettings } from "@/lib/storage";
import type { AppSettings } from "@/types";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());

  const refresh = useCallback(() => {
    setSettings(getAppSettings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = useCallback(
    (
      patch: Omit<Partial<AppSettings>, "notificationPreferences"> & {
        notificationPreferences?: Partial<AppSettings["notificationPreferences"]>;
      },
    ) => {
      updateAppSettings(patch);
      refresh();
    },
    [refresh],
  );

  return { settings, updateSettings, refresh };
}
