import type { StorageSchema } from "@/types";

/** Root key for all app data in localStorage */
export const STORAGE_ROOT_KEY = "mock_spotify_data";

/** Individual entity keys stored inside the root JSON object */
export const STORAGE_KEYS = {
  users: "users",
  artists: "artists",
  songs: "songs",
  albums: "albums",
  playlists: "playlists",
  notifications: "notifications",
  tickets: "tickets",
  subscriptions: "subscriptions",
  passwordResetRequests: "passwordResetRequests",
  authSession: "authSession",
  appSettings: "appSettings",
} as const satisfies Record<keyof StorageSchema, string>;

export const DEFAULT_APP_SETTINGS: StorageSchema["appSettings"] = {
  language: "en",
  defaultVolume: 0.7,
  notificationPreferences: {
    subscription_expiring: true,
    new_release: true,
    artist_approval: true,
    artist_rejection: true,
    monthly_earnings: true,
    new_ticket: true,
    artist_verification_request: true,
  },
};

export const EMPTY_STORAGE: StorageSchema = {
  users: [],
  artists: [],
  songs: [],
  albums: [],
  playlists: [],
  notifications: [],
  tickets: [],
  subscriptions: [],
  passwordResetRequests: [],
  authSession: null,
  appSettings: DEFAULT_APP_SETTINGS,
};

/**
 * JSON shape per entity (all arrays except authSession and appSettings):
 *
 * users:        User[]
 * artists:      Artist[]
 * songs:        Song[]
 * albums:       Album[]
 * playlists:    Playlist[]
 * notifications: Notification[]
 * tickets:      Ticket[]
 * subscriptions: Subscription[]
 * passwordResetRequests: PasswordResetRequest[]
 * authSession:  { userId, role } | null
 * appSettings:  { language, defaultVolume, notificationPreferences }
 */
