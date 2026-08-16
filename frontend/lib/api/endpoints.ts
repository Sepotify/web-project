import type {
  ArtistStatus,
  NotificationType,
  SubscriptionTier,
  TicketStatus,
  User,
  UserRole,
} from "@/types";
import { apiRequest, clearTokens, setTokens } from "@/lib/api/client";

export interface ApiArtistProfile {
  id: number;
  status: ArtistStatus;
  stage_name: string;
  rejection_reason?: string;
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

export interface ApiTicketMessage {
  id: number;
  sender_id: number;
  sender_role: UserRole;
  sender_display_name: string;
  content: string;
  created_at: string;
}

export interface ApiTicketListItem {
  id: number;
  user_id: number;
  user_display_name: string;
  user_email: string;
  subject: string;
  status: TicketStatus;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiTicketDetail extends ApiTicketListItem {
  messages: ApiTicketMessage[];
}

export interface ApiTicketList {
  count: number;
  results: ApiTicketListItem[];
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
    artistProfileId: apiUser.artist_profile
      ? String(apiUser.artist_profile.id)
      : undefined,
    artistStageName: apiUser.artist_profile?.stage_name,
    artistRejectionReason: apiUser.artist_profile?.rejection_reason ?? undefined,
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

export async function apiFetchTickets(): Promise<ApiTicketList> {
  return apiRequest<ApiTicketList>("/tickets/");
}

export async function apiFetchTicket(id: string): Promise<ApiTicketDetail> {
  return apiRequest<ApiTicketDetail>(`/tickets/${id}/`);
}

export async function apiCreateTicket(input: {
  subject: string;
  message: string;
}): Promise<ApiTicketDetail> {
  return apiRequest<ApiTicketDetail>("/tickets/", {
    method: "POST",
    body: input,
  });
}

export async function apiReplyToTicket(
  id: string,
  content: string,
): Promise<ApiTicketDetail> {
  return apiRequest<ApiTicketDetail>(`/tickets/${id}/reply/`, {
    method: "POST",
    body: { content },
  });
}

export async function apiUpdateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<ApiTicketDetail> {
  return apiRequest<ApiTicketDetail>(`/tickets/${id}/status/`, {
    method: "PATCH",
    body: { status },
  });
}

export interface ApiSong {
  id: number;
  artist_id: number;
  artist_stage_name: string;
  album_id: number | null;
  title: string;
  lyrics: string;
  genre: string;
  release_year: number;
  cover_url: string | null;
  audio_url: string | null;
  duration_seconds: number;
  is_early_access: boolean;
  featured_artist_ids: number[];
  listener_count: number;
  stream_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiAlbum {
  id: number;
  artist_id: number;
  artist_stage_name: string;
  title: string;
  genre: string;
  release_year: number;
  cover_url: string | null;
  song_ids: number[];
  songs?: ApiSong[];
  listener_count: number;
  stream_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiMyWorks {
  artist_id: number;
  albums: ApiAlbum[];
  songs: ApiSong[];
}

export interface ApiReleaseResponse {
  song?: ApiSong;
  album?: ApiAlbum;
  songs?: ApiSong[];
}

export async function apiFetchMyWorks(): Promise<ApiMyWorks> {
  return apiRequest<ApiMyWorks>("/artists/me/works/");
}

export async function apiPublishRelease(formData: FormData): Promise<ApiReleaseResponse> {
  return apiRequest<ApiReleaseResponse>("/releases/", {
    method: "POST",
    body: formData,
  });
}

export async function apiUpdateSong(id: string, formData: FormData): Promise<ApiSong> {
  return apiRequest<ApiSong>(`/songs/${id}/`, {
    method: "PATCH",
    body: formData,
  });
}

export async function apiDeleteSong(id: string): Promise<void> {
  await apiRequest<void>(`/songs/${id}/`, { method: "DELETE" });
}

export async function apiUpdateAlbum(id: string, formData: FormData): Promise<ApiAlbum> {
  return apiRequest<ApiAlbum>(`/albums/${id}/`, {
    method: "PATCH",
    body: formData,
  });
}

export async function apiDeleteAlbum(id: string): Promise<void> {
  await apiRequest<void>(`/albums/${id}/`, { method: "DELETE" });
}

export interface ApiSubscriptionDistributionSegment {
  tier: SubscriptionTier;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ApiRevenueStats {
  month_key: string;
  month_label: string;
  total_revenue: number;
  silver_revenue: number;
  gold_revenue: number;
  silver_subscribers: number;
  gold_subscribers: number;
  paying_subscribers: number;
  silver_price: number;
  gold_price: number;
}

export interface ApiSettlement {
  id: number;
  artist_id: number;
  artist_stage_name: string;
  month_key: string;
  unique_listeners: number;
  streams: number;
  payout_amount: number;
  status: "pending" | "paid";
  created_at: string;
  paid_at: string | null;
}

export interface ApiSettlementList {
  month_key: string;
  count: number;
  results: ApiSettlement[];
}

export interface ApiHomeFeed {
  latest_albums: ApiAlbum[];
  popular_songs: ApiSong[];
  early_access_songs: ApiSong[];
}

export async function apiFetchSubscriptionDistribution(): Promise<{
  results: ApiSubscriptionDistributionSegment[];
}> {
  return apiRequest("/admin/analytics/subscription-distribution/");
}

export async function apiFetchRevenueStats(month?: string): Promise<ApiRevenueStats> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiRequest<ApiRevenueStats>(`/admin/analytics/revenue/${query}`);
}

export async function apiFetchSettlements(month?: string): Promise<ApiSettlementList> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiRequest<ApiSettlementList>(`/admin/finance/settlements/${query}`);
}

export async function apiConfirmSettlement(id: string): Promise<ApiSettlement> {
  return apiRequest<ApiSettlement>(`/admin/finance/settlements/${id}/confirm/`, {
    method: "POST",
  });
}

export async function apiFetchHomeFeed(limit = 6): Promise<ApiHomeFeed> {
  return apiRequest<ApiHomeFeed>(`/home/?limit=${limit}`, { auth: false });
}

export async function apiRecordSongStream(id: string): Promise<ApiSong> {
  return apiRequest<ApiSong>(`/songs/${id}/stream/`, { method: "POST" });
}
