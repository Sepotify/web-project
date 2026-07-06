import {
  getPlaylistById,
  getRecentPlaylistPlays,
  setRecentPlaylistPlays,
} from "@/lib/storage";
import type { Playlist, RecentPlaylistPlay } from "@/types";

const MAX_STORED_PLAYS_PER_USER = 20;

export function recordPlaylistPlay(userId: string, playlistId: string): void {
  const playlist = getPlaylistById(playlistId);
  if (!playlist || playlist.userId !== userId) return;

  const now = new Date().toISOString();
  const allEntries = getRecentPlaylistPlays();
  const otherEntries = allEntries.filter(
    (entry) => !(entry.userId === userId && entry.playlistId === playlistId),
  );
  const userEntries = otherEntries
    .filter((entry) => entry.userId === userId)
    .sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
    )
    .slice(0, MAX_STORED_PLAYS_PER_USER - 1);

  const nextEntry: RecentPlaylistPlay = {
    id: crypto.randomUUID(),
    userId,
    playlistId,
    playedAt: now,
  };

  const remaining = otherEntries.filter((entry) => entry.userId !== userId);
  setRecentPlaylistPlays([...remaining, ...userEntries, nextEntry]);
}

export function getRecentlyPlayedPlaylists(
  userId: string,
  limit = 6,
): Playlist[] {
  const seen = new Set<string>();
  const playlists: Playlist[] = [];

  const plays = getRecentPlaylistPlays()
    .filter((entry) => entry.userId === userId)
    .sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
    );

  for (const play of plays) {
    if (seen.has(play.playlistId)) continue;

    const playlist = getPlaylistById(play.playlistId);
    if (!playlist || playlist.userId !== userId) continue;

    playlists.push(playlist);
    seen.add(play.playlistId);

    if (playlists.length >= limit) break;
  }

  return playlists;
}
