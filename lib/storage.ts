import {
  DEFAULT_APP_SETTINGS,
  EMPTY_STORAGE,
  STORAGE_ROOT_KEY,
} from "@/lib/storage-keys";
import type {
  Album,
  Artist,
  AuthSession,
  Notification,
  Playlist,
  RecentPlaylistPlay,
  Song,
  StorageSchema,
  Subscription,
  Ticket,
  ArtistSettlement,
  User,
} from "@/types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): StorageSchema {
  if (!isBrowser()) return { ...EMPTY_STORAGE };

  try {
    const raw = localStorage.getItem(STORAGE_ROOT_KEY);
    if (!raw) return { ...EMPTY_STORAGE };

    const parsed = JSON.parse(raw) as Partial<StorageSchema>;
    return {
      ...EMPTY_STORAGE,
      ...parsed,
      appSettings: {
        ...DEFAULT_APP_SETTINGS,
        ...parsed.appSettings,
        notificationPreferences: {
          ...DEFAULT_APP_SETTINGS.notificationPreferences,
          ...parsed.appSettings?.notificationPreferences,
        },
      },
    };
  } catch {
    return { ...EMPTY_STORAGE };
  }
}

function writeAll(data: StorageSchema): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_ROOT_KEY, JSON.stringify(data));
}

function update<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K],
): void {
  const data = readAll();
  data[key] = value;
  writeAll(data);
}

// ── Users ──────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return readAll().users;
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return getUsers().find((u) => u.email.toLowerCase() === normalized);
}

export function addUser(user: User): void {
  update("users", [...getUsers(), user]);
}

export function updateUser(id: string, patch: Partial<User>): void {
  update(
    "users",
    getUsers().map((u) => (u.id === id ? { ...u, ...patch } : u)),
  );
}

export function mutateUsers(mutator: (users: User[]) => User[]): void {
  update("users", mutator(getUsers()));
}

export function deleteUser(id: string): void {
  update(
    "users",
    getUsers().filter((u) => u.id !== id),
  );
}

// ── Artists ────────────────────────────────────────────────────────────────

export function getArtists(): Artist[] {
  return readAll().artists;
}

export function getArtistById(id: string): Artist | undefined {
  return getArtists().find((a) => a.id === id);
}

export function getArtistByUserId(userId: string): Artist | undefined {
  return getArtists().find((a) => a.userId === userId);
}

export function addArtist(artist: Artist): void {
  update("artists", [...getArtists(), artist]);
}

export function updateArtist(id: string, patch: Partial<Artist>): void {
  update(
    "artists",
    getArtists().map((a) => (a.id === id ? { ...a, ...patch } : a)),
  );
}

// ── Songs ──────────────────────────────────────────────────────────────────

export function getSongs(): Song[] {
  return readAll().songs;
}

export function getSongById(id: string): Song | undefined {
  return getSongs().find((s) => s.id === id);
}

export function addSong(song: Song): void {
  update("songs", [...getSongs(), song]);
}

export function updateSong(id: string, patch: Partial<Song>): void {
  update(
    "songs",
    getSongs().map((s) => (s.id === id ? { ...s, ...patch } : s)),
  );
}

export function deleteSong(id: string): void {
  update(
    "songs",
    getSongs().filter((s) => s.id !== id),
  );
}

// ── Albums ─────────────────────────────────────────────────────────────────

export function getAlbums(): Album[] {
  return readAll().albums;
}

export function getAlbumById(id: string): Album | undefined {
  return getAlbums().find((a) => a.id === id);
}

export function addAlbum(album: Album): void {
  update("albums", [...getAlbums(), album]);
}

export function updateAlbum(id: string, patch: Partial<Album>): void {
  update(
    "albums",
    getAlbums().map((a) => (a.id === id ? { ...a, ...patch } : a)),
  );
}

export function deleteAlbum(id: string): void {
  update(
    "albums",
    getAlbums().filter((a) => a.id !== id),
  );
}

// ── Playlists ──────────────────────────────────────────────────────────────

export function getPlaylists(): Playlist[] {
  return readAll().playlists;
}

export function getPlaylistsByUser(userId: string): Playlist[] {
  return getPlaylists().filter((p) => p.userId === userId);
}

export function getPlaylistById(id: string): Playlist | undefined {
  return getPlaylists().find((p) => p.id === id);
}

export function addPlaylist(playlist: Playlist): void {
  update("playlists", [...getPlaylists(), playlist]);
}

export function updatePlaylist(id: string, patch: Partial<Playlist>): void {
  update(
    "playlists",
    getPlaylists().map((p) => (p.id === id ? { ...p, ...patch } : p)),
  );
}

export function deletePlaylist(id: string): void {
  update(
    "playlists",
    getPlaylists().filter((p) => p.id !== id),
  );

  update(
    "recentPlaylistPlays",
    getRecentPlaylistPlays().filter((entry) => entry.playlistId !== id),
  );
}

// ── Recent playlist plays ──────────────────────────────────────────────────

export function getRecentPlaylistPlays(): RecentPlaylistPlay[] {
  return readAll().recentPlaylistPlays;
}

export function getRecentPlaylistPlaysByUser(userId: string): RecentPlaylistPlay[] {
  return getRecentPlaylistPlays()
    .filter((entry) => entry.userId === userId)
    .sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
    );
}

export function addRecentPlaylistPlay(entry: RecentPlaylistPlay): void {
  update("recentPlaylistPlays", [...getRecentPlaylistPlays(), entry]);
}

export function setRecentPlaylistPlays(entries: RecentPlaylistPlay[]): void {
  update("recentPlaylistPlays", entries);
}

export function clearRecentPlaylistPlaysForUser(userId: string): void {
  update(
    "recentPlaylistPlays",
    getRecentPlaylistPlays().filter((entry) => entry.userId !== userId),
  );
}

// ── Notifications ──────────────────────────────────────────────────────────

export function getNotifications(): Notification[] {
  return readAll().notifications;
}

export function getNotificationsByUser(userId: string): Notification[] {
  return getNotifications().filter((n) => n.userId === userId);
}

export function addNotification(notification: Notification): void {
  update("notifications", [...getNotifications(), notification]);
}

export function updateNotification(
  id: string,
  patch: Partial<Notification>,
): void {
  update(
    "notifications",
    getNotifications().map((n) => (n.id === id ? { ...n, ...patch } : n)),
  );
}

export function deleteNotification(id: string): void {
  update(
    "notifications",
    getNotifications().filter((n) => n.id !== id),
  );
}

// ── Tickets ────────────────────────────────────────────────────────────────

export function getTickets(): Ticket[] {
  return readAll().tickets;
}

export function getTicketById(id: string): Ticket | undefined {
  return getTickets().find((ticket) => ticket.id === id);
}

export function addTicket(ticket: Ticket): void {
  update("tickets", [...getTickets(), ticket]);
}

export function updateTicket(id: string, patch: Partial<Ticket>): void {
  update(
    "tickets",
    getTickets().map((t) => (t.id === id ? { ...t, ...patch } : t)),
  );
}

// ── Artist settlements ─────────────────────────────────────────────────────

export function getArtistSettlements(): ArtistSettlement[] {
  return readAll().artistSettlements;
}

export function getArtistSettlementById(id: string): ArtistSettlement | undefined {
  return getArtistSettlements().find((settlement) => settlement.id === id);
}

export function addArtistSettlement(settlement: ArtistSettlement): void {
  update("artistSettlements", [...getArtistSettlements(), settlement]);
}

export function updateArtistSettlement(
  id: string,
  patch: Partial<ArtistSettlement>,
): void {
  update(
    "artistSettlements",
    getArtistSettlements().map((settlement) =>
      settlement.id === id ? { ...settlement, ...patch } : settlement,
    ),
  );
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export function getSubscriptions(): Subscription[] {
  return readAll().subscriptions;
}

export function getSubscriptionByUser(userId: string): Subscription | undefined {
  return getSubscriptions().find((s) => s.userId === userId && s.isActive);
}

export function addSubscription(subscription: Subscription): void {
  update("subscriptions", [...getSubscriptions(), subscription]);
}

export function updateSubscription(
  id: string,
  patch: Partial<Subscription>,
): void {
  update(
    "subscriptions",
    getSubscriptions().map((s) => (s.id === id ? { ...s, ...patch } : s)),
  );
}

// ── Password Reset ─────────────────────────────────────────────────────────

export function getPasswordResetRequests(): StorageSchema["passwordResetRequests"] {
  return readAll().passwordResetRequests;
}

export function addPasswordResetRequest(
  request: StorageSchema["passwordResetRequests"][number],
): void {
  update("passwordResetRequests", [...getPasswordResetRequests(), request]);
}

// ── Auth Session ───────────────────────────────────────────────────────────

export function getAuthSession(): AuthSession | null {
  return readAll().authSession;
}

export function setAuthSession(session: AuthSession | null): void {
  update("authSession", session);
}

// ── App Settings ───────────────────────────────────────────────────────────

export function getAppSettings(): StorageSchema["appSettings"] {
  return readAll().appSettings;
}

export function updateAppSettings(
  patch: Omit<Partial<StorageSchema["appSettings"]>, "notificationPreferences"> & {
    notificationPreferences?: Partial<
      StorageSchema["appSettings"]["notificationPreferences"]
    >;
  },
): void {
  const current = getAppSettings();
  update("appSettings", {
    ...current,
    ...patch,
    notificationPreferences: patch.notificationPreferences
      ? { ...current.notificationPreferences, ...patch.notificationPreferences }
      : current.notificationPreferences,
  });
}

// ── Utility ────────────────────────────────────────────────────────────────

export function resetStorage(): void {
  writeAll({ ...EMPTY_STORAGE });
}

export function seedStorage(data: Partial<StorageSchema>): void {
  writeAll({ ...EMPTY_STORAGE, ...readAll(), ...data });
}

export function deleteUserAccount(userId: string): boolean {
  const user = getUsers().find((entry) => entry.id === userId);
  if (!user) return false;

  mutateUsers((users) =>
    users
      .filter((entry) => entry.id !== userId)
      .map((entry) => ({
        ...entry,
        followerIds: entry.followerIds.filter((id) => id !== userId),
        followingUserIds: entry.followingUserIds.filter((id) => id !== userId),
      })),
  );

  update(
    "playlists",
    getPlaylists().filter((playlist) => playlist.userId !== userId),
  );

  update(
    "recentPlaylistPlays",
    getRecentPlaylistPlays().filter((entry) => entry.userId !== userId),
  );

  update(
    "notifications",
    getNotifications().filter((notification) => notification.userId !== userId),
  );

  update(
    "tickets",
    getTickets().filter((ticket) => ticket.userId !== userId),
  );

  update(
    "subscriptions",
    getSubscriptions().filter((subscription) => subscription.userId !== userId),
  );

  update(
    "artists",
    getArtists().filter((artist) => artist.userId !== userId),
  );

  update(
    "passwordResetRequests",
    getPasswordResetRequests().filter((request) => request.userId !== userId),
  );

  const session = getAuthSession();
  if (session?.userId === userId) {
    setAuthSession(null);
  }

  return true;
}
