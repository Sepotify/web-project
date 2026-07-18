"use client";

import { Toggle } from "@/components/settings/Toggle";
import {
  getNotificationTypesForRole,
  NOTIFICATION_DESCRIPTIONS,
  NOTIFICATION_LABELS,
} from "@/lib/settings";
import type { AppSettings } from "@/types";
import type { UserRole } from "@/types";

interface NotificationSettingsProps {
  role: UserRole;
  preferences: AppSettings["notificationPreferences"];
  onChange: (type: keyof AppSettings["notificationPreferences"], enabled: boolean) => void;
}

export function NotificationSettings({
  role,
  preferences,
  onChange,
}: NotificationSettingsProps) {
  const types = getNotificationTypesForRole(role);

  return (
    <div className="flex flex-col gap-3">
      {types.map((type) => (
        <Toggle
          key={type}
          label={NOTIFICATION_LABELS[type]}
          description={NOTIFICATION_DESCRIPTIONS[type]}
          checked={preferences[type]}
          onChange={(enabled) => onChange(type, enabled)}
        />
      ))}
    </div>
  );
}
