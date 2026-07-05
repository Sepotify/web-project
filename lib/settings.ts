import type { NotificationType, UserRole } from "@/types";

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  subscription_expiring: "Subscription expiry alerts",
  new_release: "New releases from followed artists",
  artist_approval: "Artist account approval updates",
  artist_rejection: "Artist account rejection notices",
  monthly_earnings: "Monthly earnings reports",
  new_ticket: "Support ticket updates",
  artist_verification_request: "Artist verification requests",
};

export const NOTIFICATION_DESCRIPTIONS: Record<NotificationType, string> = {
  subscription_expiring: "Get notified before your subscription expires.",
  new_release: "Alerts when artists you follow publish new music.",
  artist_approval: "Updates when your artist account is approved.",
  artist_rejection: "Updates when your artist application is rejected.",
  monthly_earnings: "Monthly payout and earnings summaries.",
  new_ticket: "New support tickets and responses.",
  artist_verification_request: "New artist verification requests to review.",
};

export function getNotificationTypesForRole(role: UserRole): NotificationType[] {
  switch (role) {
    case "listener":
      return ["subscription_expiring", "new_release"];
    case "artist":
      return [
        "artist_approval",
        "artist_rejection",
        "monthly_earnings",
        "new_release",
      ];
    case "support":
    case "admin":
      return ["new_ticket", "artist_verification_request"];
    default:
      return [];
  }
}

export const LANGUAGE_OPTIONS = [
  { value: "en" as const, label: "English" },
  { value: "fa" as const, label: "Persian (فارسی)" },
];

export const MIN_VOLUME = 0;
export const MAX_VOLUME = 1;
export const VOLUME_STEP = 0.05;

export function formatVolume(value: number): string {
  return `${Math.round(value * 100)}%`;
}
