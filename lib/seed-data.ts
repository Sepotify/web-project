import type {
  Album,
  Artist,
  Notification,
  Playlist,
  RecentPlaylistPlay,
  Song,
  StorageSchema,
  Subscription,
  User,
} from "@/types";

const now = new Date().toISOString();

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const MOCK_ARTIST_ID = "artist-sara-1";
export const MOCK_ALBUM_ID = "album-midnight-echoes";

export const MOCK_USERS: User[] = [
  {
    id: "user-listener-1",
    email: "listener@example.com",
    password: "123456",
    displayName: "Ali Listener",
    username: "ali_listener",
    role: "listener",
    subscription: "silver",
    followerIds: ["user-listener-2"],
    followingUserIds: ["user-artist-1"],
    followingArtistIds: [MOCK_ARTIST_ID],
    dailyStreamCount: 12,
    birthDate: "2000-05-15",
    gender: "male",
    createdAt: now,
  },
  {
    id: "user-listener-2",
    email: "basic@example.com",
    password: "123456",
    displayName: "Jamie Basic",
    username: "jamie_basic",
    role: "listener",
    subscription: "basic",
    followerIds: [],
    followingUserIds: ["user-listener-1"],
    followingArtistIds: [],
    dailyStreamCount: 4,
    birthDate: "2002-08-10",
    gender: "female",
    createdAt: now,
  },
  {
    id: "user-artist-1",
    email: "artist@example.com",
    password: "123456",
    displayName: "Sara Artist",
    username: "sara_artist",
    role: "artist",
    subscription: "gold",
    followerIds: ["user-listener-1"],
    followingUserIds: [],
    followingArtistIds: [],
    dailyStreamCount: 0,
    birthDate: "1998-03-20",
    gender: "female",
    createdAt: now,
  },
  {
    id: "user-support-1",
    email: "support@example.com",
    password: "123456",
    displayName: "Reza Support",
    username: "reza_support",
    role: "support",
    subscription: "gold",
    followerIds: [],
    followingUserIds: [],
    followingArtistIds: [],
    dailyStreamCount: 0,
    createdAt: now,
  },
  {
    id: "user-admin-1",
    email: "admin@example.com",
    password: "123456",
    displayName: "System Admin",
    username: "system_admin",
    role: "admin",
    subscription: "gold",
    followerIds: [],
    followingUserIds: [],
    followingArtistIds: [],
    dailyStreamCount: 0,
    createdAt: now,
  },
  {
    id: "user-artist-pending-1",
    email: "pending@example.com",
    password: "123456",
    displayName: "Nova Waves",
    username: "nova_waves",
    role: "artist",
    subscription: "basic",
    followerIds: [],
    followingUserIds: [],
    followingArtistIds: [],
    dailyStreamCount: 0,
    createdAt: daysAgo(2),
  },
];

export const MOCK_PENDING_ARTIST_ID = "artist-nova-waves";

export const MOCK_ARTISTS: Artist[] = [
  {
    id: MOCK_ARTIST_ID,
    userId: "user-artist-1",
    stageName: "Sara Artist",
    bio: "Electronic and ambient music producer.",
    status: "approved",
    isVerified: true,
    totalListeners: 12800,
    totalStreams: 54000,
    createdAt: now,
  },
  {
    id: MOCK_PENDING_ARTIST_ID,
    userId: "user-artist-pending-1",
    stageName: "Nova Waves",
    portfolioUrl:
      "https://soundcloud.com/example/nova-waves\nLive sets and ambient demos from 2024-2026.",
    status: "pending",
    isVerified: false,
    totalListeners: 0,
    totalStreams: 0,
    createdAt: daysAgo(2),
  },
];

export const MOCK_SONGS: Song[] = [
  {
    id: "song-neon-dreams",
    title: "Neon Dreams",
    artistId: MOCK_ARTIST_ID,
    albumId: MOCK_ALBUM_ID,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    lyrics: "Neon lights are calling out my name\nRunning through the midnight rain\nEvery dream is painted in bright color\nWe are young and we won't fade away",
    genre: "Electronic",
    releaseYear: 2024,
    featuredArtistIds: [],
    listenerCount: 8200,
    streamCount: 24000,
    durationSeconds: 214,
    createdAt: now,
  },
  {
    id: "song-city-lights",
    title: "City Lights",
    artistId: MOCK_ARTIST_ID,
    albumId: MOCK_ALBUM_ID,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    lyrics: "City lights above the skyline glow\nEvery street has stories that we know\nHold my hand and walk into the night\nEverything will be alright",
    genre: "Electronic",
    releaseYear: 2024,
    featuredArtistIds: [],
    listenerCount: 6100,
    streamCount: 18000,
    durationSeconds: 192,
    createdAt: now,
  },
  {
    id: "song-solitude",
    title: "Solitude",
    artistId: MOCK_ARTIST_ID,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    genre: "Ambient",
    releaseYear: 2025,
    featuredArtistIds: [],
    listenerCount: 4300,
    streamCount: 9200,
    durationSeconds: 248,
    isEarlyAccess: true,
    createdAt: now,
  },
  {
    id: "song-aurora-premiere",
    title: "Aurora Premiere",
    artistId: MOCK_ARTIST_ID,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    genre: "Electronic",
    releaseYear: 2026,
    featuredArtistIds: [],
    listenerCount: 1200,
    streamCount: 800,
    durationSeconds: 231,
    isEarlyAccess: true,
    createdAt: now,
  },
  {
    id: "song-echoes",
    title: "Echoes",
    artistId: MOCK_ARTIST_ID,
    albumId: MOCK_ALBUM_ID,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    lyrics: "Echoes in the hallway of my mind\nLeave the noise of the world behind\nSoft vibrations fill the empty room\nDancing slowly in the quiet gloom",
    genre: "Electronic",
    releaseYear: 2024,
    featuredArtistIds: [],
    listenerCount: 3900,
    streamCount: 11000,
    durationSeconds: 205,
    createdAt: now,
  },
];

export const MOCK_ALBUMS: Album[] = [
  {
    id: MOCK_ALBUM_ID,
    title: "Midnight Echoes",
    artistId: MOCK_ARTIST_ID,
    genre: "Electronic",
    releaseYear: 2024,
    songIds: ["song-neon-dreams", "song-city-lights", "song-echoes"],
    listenerCount: 15000,
    streamCount: 53000,
    createdAt: now,
  },
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: "playlist-listener-favorites",
    userId: "user-listener-1",
    name: "Late Night Drive",
    songIds: ["song-neon-dreams", "song-solitude"],
    createdAt: now,
    updatedAt: now,
  },
];

export const MOCK_RECENT_PLAYLIST_PLAYS: RecentPlaylistPlay[] = [
  {
    id: "recent-play-1",
    userId: "user-listener-1",
    playlistId: "playlist-listener-favorites",
    playedAt: now,
  },
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "subscription-listener-1",
    userId: "user-listener-1",
    tier: "silver",
    startDate: daysAgo(27),
    endDate: daysFromNow(3),
    isActive: true,
  },
  {
    id: "subscription-artist-1",
    userId: "user-artist-1",
    tier: "gold",
    startDate: daysAgo(60),
    isActive: true,
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notification-listener-expiry",
    userId: "user-listener-1",
    type: "subscription_expiring",
    title: "Your Silver plan expires soon",
    message: "Your subscription ends in 3 days. Renew to keep your playlist limits and perks.",
    link: "/settings",
    isRead: false,
    createdAt: daysAgo(0),
  },
  {
    id: "notification-listener-release",
    userId: "user-listener-1",
    type: "new_release",
    title: "Sara Artist dropped a new single",
    message: "Solitude is now available. Tap to listen to the latest release.",
    link: "/albums",
    isRead: false,
    createdAt: daysAgo(1),
  },
  {
    id: "notification-listener-release-read",
    userId: "user-listener-1",
    type: "new_release",
    title: "Midnight Echoes album is out",
    message: "Sara Artist published a new album with 3 tracks.",
    link: `/albums/${MOCK_ALBUM_ID}`,
    isRead: true,
    createdAt: daysAgo(4),
  },
  {
    id: "notification-artist-earnings",
    userId: "user-artist-1",
    type: "monthly_earnings",
    title: "March earnings are ready",
    message: "Your monthly payout summary is available. Review streams and listener stats.",
    link: "/artist/works",
    isRead: false,
    createdAt: daysAgo(2),
  },
  {
    id: "notification-artist-approval",
    userId: "user-artist-1",
    type: "artist_approval",
    title: "Your artist account was approved",
    message: "You can now upload music and manage your catalog.",
    link: "/artist/works",
    isRead: true,
    createdAt: daysAgo(10),
  },
  {
    id: "notification-admin-ticket",
    userId: "user-admin-1",
    type: "new_ticket",
    title: "New support ticket opened",
    message: "A listener reported a playback issue. Review and assign the ticket.",
    link: "/dashboard",
    isRead: false,
    createdAt: daysAgo(0),
  },
  {
    id: "notification-admin-verification",
    userId: "user-admin-1",
    type: "artist_verification_request",
    title: "Artist verification request",
    message: "A new artist submitted portfolio links for verification review.",
    link: "/dashboard",
    isRead: false,
    createdAt: daysAgo(1),
  },
  {
    id: "notification-support-ticket",
    userId: "user-support-1",
    type: "new_ticket",
    title: "Ticket #1042 needs a response",
    message: "Jamie Basic asked about upgrading from Basic to Silver.",
    link: "/dashboard",
    isRead: false,
    createdAt: daysAgo(0),
  },
];

export const MOCK_SEED_DATA: Partial<StorageSchema> = {
  users: MOCK_USERS,
  artists: MOCK_ARTISTS,
  albums: MOCK_ALBUMS,
  songs: MOCK_SONGS,
  playlists: MOCK_PLAYLISTS,
  recentPlaylistPlays: MOCK_RECENT_PLAYLIST_PLAYS,
  notifications: MOCK_NOTIFICATIONS,
  subscriptions: MOCK_SUBSCRIPTIONS,
};
