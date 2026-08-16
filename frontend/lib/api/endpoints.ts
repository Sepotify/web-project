import type {
  ArtistStatus,
  NotificationType,
  SubscriptionTier,
  User,
  UserRole,
} from "@/types";
import { apiRequest, clearTokens, setTokens } from "@/lib/api/client";

export interface ApiArtistProfile {
  id: number;
  status: ArtistStatus;
  stage_name: string;
}

export interface ApiUser {
  id: number;
  email: string;
  display_name: string;
  username: string;
  role: UserRole;
  subscription: SubscriptionTier;
  avatar_url?: string | null;
  birth_date?: string | null;
  gender?: User["gender"] | null;
  daily_stream_count: number;
  follower_count?: number;
  following_count?: number;
  artist_profile?: ApiArtistProfile | null;
  date_joined?: string;
  can_upload_avatar?: boolean;
}

export interface ApiTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: ApiUser;
  tokens: ApiTokens;
}

export interface ApiNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiNotificationList {
  count: number;
  unread_count: number;
  results: ApiNotification[];
}

export interface ApiSettings {
  language: "fa" | "en";
  default_volume: number;
  notification_preferences: Record<NotificationType, boolean>;
  updated_at: string;
}

export interface ApiPricing {
  silver_monthly: string | number;
  gold_monthly: string | number;
  updated_at: string;
}

export function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    password: "",
    displayName: apiUser.display_name,
    username: apiUser.username,
    role: apiUser.role,
    subscription: apiUser.subscription,
    avatarUrl: apiUser.avatar_url ?? undefined,
    birthDate: apiUser.birth_date ?? undefined,
    gender: apiUser.gender ?? undefined,
    followerIds: [],
    followingUserIds: [],
    followingArtistIds: [],
    dailyStreamCount: apiUser.daily_stream_count ?? 0,
    createdAt: apiUser.date_joined ?? new Date().toISOString(),
    artistStatus: apiUser.artist_profile?.status,
  };
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>("/auth/login/", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  setTokens(data.tokens.access, data.tokens.refresh);
  return data;
}

export async function apiLogout(): Promise<void> {
  const { getRefreshToken } = await import("@/lib/api/client");
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiRequest("/auth/logout/", {
        method: "POST",
        body: { refresh },
      });
    }
  } catch {
    // Ignore logout API errors; always clear local tokens.
  } finally {
    clearTokens();
  }
}

export async function apiFetchMe(): Promise<ApiUser> {
  return apiRequest<ApiUser>("/users/me/");
}

export async function apiFetchNotifications(): Promise<ApiNotificationList> {
  return apiRequest<ApiNotificationList>("/notifications/");
}

export async function apiMarkNotificationRead(id: string): Promise<ApiNotification> {
  return apiRequest<ApiNotification>(`/notifications/${id}/read/`, {
    method: "PATCH",
  });
}

export async function apiMarkAllNotificationsRead(): Promise<{ updated: number }> {
  return apiRequest<{ updated: number }>("/notifications/mark-all-read/", {
    method: "POST",
  });
}

export async function apiDeleteNotification(id: string): Promise<void> {
  await apiRequest<void>(`/notifications/${id}/`, { method: "DELETE" });
}

export async function apiFetchSettings(): Promise<ApiSettings> {
  return apiRequest<ApiSettings>("/users/me/settings/");
}

export async function apiUpdateSettings(
  patch: Partial<{
    language: "fa" | "en";
    default_volume: number;
    notification_preferences: Partial<Record<NotificationType, boolean>>;
  }>,
): Promise<ApiSettings> {
  return apiRequest<ApiSettings>("/users/me/settings/", {
    method: "PATCH",
    body: patch,
  });
}

export async function apiFetchPricing(): Promise<ApiPricing> {
  return apiRequest<ApiPricing>("/pricing/", { auth: false });
}

export async function apiUpdatePricing(input: {
  silver_monthly: number;
  gold_monthly: number;
}): Promise<ApiPricing> {
  return apiRequest<ApiPricing>("/admin/pricing/", {
    method: "PATCH",
    body: input,
  });
}

export async function apiCheckSubscriptionExpiry(): Promise<void> {
  // Expiry is enforced server-side via management command / signals.
  // Calling me/subscription keeps client session aware of current tier.
  await apiRequest("/users/me/subscription/");
}
