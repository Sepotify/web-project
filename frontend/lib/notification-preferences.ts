import { DEFAULT_APP_SETTINGS } from "@/lib/storage-keys";
import { getUserById, updateUser } from "@/lib/storage";
import type { NotificationType } from "@/types";

export function getUserNotificationPreferences(
  userId: string,
): Record<NotificationType, boolean> {
  const user = getUserById(userId);

  return {
    ...DEFAULT_APP_SETTINGS.notificationPreferences,
    ...user?.notificationPreferences,
  };
}

export function isNotificationTypeEnabled(
  userId: string,
  type: NotificationType,
): boolean {
  return getUserNotificationPreferences(userId)[type];
}

export function updateUserNotificationPreference(
  userId: string,
  type: NotificationType,
  enabled: boolean,
): void {
  const user = getUserById(userId);
  if (!user) return;

  updateUser(userId, {
    notificationPreferences: {
      ...getUserNotificationPreferences(userId),
      [type]: enabled,
    },
  });
}
