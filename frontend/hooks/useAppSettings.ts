"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetchSettings, apiUpdateSettings } from "@/lib/api/endpoints";
import { getAppSettings, updateAppSettings } from "@/lib/storage";
import { useAuth } from "@/store/AuthContext";
import type { AppSettings, NotificationType } from "@/types";

export function useAppSettings() {
  const { useApiAuth, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (useApiAuth && isAuthenticated) {
      setIsLoading(true);
      try {
        const data = await apiFetchSettings();
        const next: AppSettings = {
          language: data.language,
          defaultVolume: data.default_volume,
          notificationPreferences: data.notification_preferences,
        };
        updateAppSettings(next);
        setSettings(next);
      } catch {
        setSettings(getAppSettings());
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setSettings(getAppSettings());
  }, [isAuthenticated, useApiAuth]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateSettings = useCallback(
    async (
      patch: Omit<Partial<AppSettings>, "notificationPreferences"> & {
        notificationPreferences?: Partial<Record<NotificationType, boolean>>;
      },
    ) => {
      if (useApiAuth && isAuthenticated) {
        const data = await apiUpdateSettings({
          language: patch.language,
          default_volume: patch.defaultVolume,
          notification_preferences: patch.notificationPreferences,
        });
        const next: AppSettings = {
          language: data.language,
          defaultVolume: data.default_volume,
          notificationPreferences: data.notification_preferences,
        };
        updateAppSettings(next);
        setSettings(next);
        return next;
      }

      updateAppSettings(patch);
      const next = getAppSettings();
      setSettings(next);
      return next;
    },
    [isAuthenticated, useApiAuth],
  );

  return { settings, updateSettings, refresh, isLoading };
}
