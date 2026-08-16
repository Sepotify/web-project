export type UserRole = "listener" | "artist" | "support" | "admin";

export type SubscriptionTier = "basic" | "silver" | "gold";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type ArtistStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  username: string;
  role: UserRole;
  subscription: SubscriptionTier;
  avatarUrl?: string;
  birthDate?: string;
  gender?: Gender;
  followerIds: string[];
  followingUserIds: string[];
  followingArtistIds: string[];
  followerCount?: number;
  followingCount?: number;
  dailyStreamCount: number;
  notificationPreferences?: Partial<Record<NotificationType, boolean>>;
  artistStatus?: ArtistStatus;
  artistProfileId?: string;
  artistStageName?: string;
  artistRejectionReason?: string;
  createdAt: string;
}

export interface Artist {
  id: string;
  userId: string;
  stageName: string;
  bio?: string;
  portfolioUrl?: string;
  status: ArtistStatus;
  rejectionReason?: string;
  isVerified: boolean;
  totalListeners: number;
  totalStreams: number;
  createdAt: string;
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  albumId?: string;
  coverUrl?: string;
  audioUrl?: string;
  lyrics?: string;
  genre?: string;
  releaseYear?: number;
  featuredArtistIds: string[];
  listenerCount: number;
  streamCount: number;
  durationSeconds: number;
  isEarlyAccess?: boolean;
  createdAt: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  coverUrl?: string;
  genre?: string;
  releaseYear?: number;
  songIds: string[];
  listenerCount: number;
  streamCount: number;
  createdAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "subscription_expiring"
  | "new_release"
  | "artist_approval"
  | "artist_rejection"
  | "monthly_earnings"
  | "new_ticket"
  | "artist_verification_request";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface TicketMessage {
  id: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export type SettlementStatus = "pending" | "paid";

export interface ArtistSettlement {
  id: string;
  artistId: string;
  monthKey: string;
  uniqueListeners: number;
  streams: number;
  payoutAmount: number;
  status: SettlementStatus;
  createdAt: string;
  paidAt?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface AppSettings {
  language: "fa" | "en";
  defaultVolume: number;
  notificationPreferences: Record<NotificationType, boolean>;
}

export interface SubscriptionPricing {
  silverMonthly: number;
  goldMonthly: number;
  updatedAt: string;
}

export interface RecentPlaylistPlay {
  id: string;
  userId: string;
  playlistId: string;
  playedAt: string;
}

export interface StorageSchema {
  users: User[];
  artists: Artist[];
  songs: Song[];
  albums: Album[];
  playlists: Playlist[];
  recentPlaylistPlays: RecentPlaylistPlay[];
  notifications: Notification[];
  tickets: Ticket[];
  artistSettlements: ArtistSettlement[];
  subscriptions: Subscription[];
  passwordResetRequests: PasswordResetRequest[];
  authSession: AuthSession | null;
  appSettings: AppSettings;
  subscriptionPricing: SubscriptionPricing;
}
