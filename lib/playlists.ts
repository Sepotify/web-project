import {
  addPlaylist,
  deletePlaylist,
  getPlaylistById,
  getPlaylistsByUser,
  updatePlaylist,
} from "@/lib/storage";
import { validateRequired } from "@/lib/validation";
import type { Playlist, SubscriptionTier, User } from "@/types";

export const PLAYLIST_LIMITS: Record<SubscriptionTier, number | null> = {
  basic: 6,
  silver: 100,
  gold: null,
};

export interface PlaylistLimitInfo {
  current: number;
  limit: number | null;
  remaining: number | null;
  label: string;
}

export interface PlaylistActionResult {
  success: boolean;
  playlist?: Playlist;
  error?: string;
}

export function getPlaylistLimit(tier: SubscriptionTier): number | null {
  return PLAYLIST_LIMITS[tier];
}

export function getPlaylistLimitInfo(user: User): PlaylistLimitInfo {
  const current = getPlaylistsByUser(user.id).length;
  const limit = getPlaylistLimit(user.subscription);

  if (limit === null) {
    return {
      current,
      limit: null,
      remaining: null,
      label: `${current} playlists (unlimited)`,
    };
  }

  return {
    current,
    limit,
    remaining: Math.max(limit - current, 0),
    label: `${current} / ${limit} playlists`,
  };
}

export function canCreatePlaylist(user: User): { allowed: boolean; message?: string } {
  const { current, limit } = getPlaylistLimitInfo(user);

  if (limit !== null && current >= limit) {
    return {
      allowed: false,
      message: `You reached the ${limit}-playlist limit for the ${user.subscription} plan.`,
    };
  }

  return { allowed: true };
}

function validatePlaylistName(name: string): string | undefined {
  const required = validateRequired(name, "Playlist name");
  if (required) return required;
  if (name.trim().length > 80) {
    return "Playlist name must be 80 characters or less.";
  }
  return undefined;
}

export function createPlaylist(user: User, name: string): PlaylistActionResult {
  const limitCheck = canCreatePlaylist(user);
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.message };
  }

  const nameError = validatePlaylistName(name);
  if (nameError) {
    return { success: false, error: nameError };
  }

  const userPlaylists = getPlaylistsByUser(user.id);
  const duplicate = userPlaylists.some(
    (playlist) => playlist.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (duplicate) {
    return { success: false, error: "You already have a playlist with this name." };
  }

  const now = new Date().toISOString();
  const playlist: Playlist = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: name.trim(),
    songIds: [],
    createdAt: now,
    updatedAt: now,
  };

  addPlaylist(playlist);
  return { success: true, playlist };
}

export function renamePlaylist(
  playlistId: string,
  userId: string,
  name: string,
): PlaylistActionResult {
  const playlist = getPlaylistById(playlistId);
  if (!playlist || playlist.userId !== userId) {
    return { success: false, error: "Playlist not found." };
  }

  const nameError = validatePlaylistName(name);
  if (nameError) {
    return { success: false, error: nameError };
  }

  const duplicate = getPlaylistsByUser(userId).some(
    (entry) =>
      entry.id !== playlistId &&
      entry.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (duplicate) {
    return { success: false, error: "You already have a playlist with this name." };
  }

  updatePlaylist(playlistId, {
    name: name.trim(),
    updatedAt: new Date().toISOString(),
  });

  return { success: true, playlist: getPlaylistById(playlistId) };
}

export function removePlaylist(playlistId: string, userId: string): PlaylistActionResult {
  const playlist = getPlaylistById(playlistId);
  if (!playlist || playlist.userId !== userId) {
    return { success: false, error: "Playlist not found." };
  }

  deletePlaylist(playlistId);
  return { success: true };
}

export function addSongToPlaylist(
  playlistId: string,
  userId: string,
  songId: string,
): PlaylistActionResult {
  const playlist = getPlaylistById(playlistId);
  if (!playlist || playlist.userId !== userId) {
    return { success: false, error: "Playlist not found." };
  }

  if (playlist.songIds.includes(songId)) {
    return { success: false, error: "This song is already in the playlist." };
  }

  updatePlaylist(playlistId, {
    songIds: [...playlist.songIds, songId],
    updatedAt: new Date().toISOString(),
  });

  return { success: true, playlist: getPlaylistById(playlistId) };
}

export function removeSongFromPlaylist(
  playlistId: string,
  userId: string,
  songId: string,
): PlaylistActionResult {
  const playlist = getPlaylistById(playlistId);
  if (!playlist || playlist.userId !== userId) {
    return { success: false, error: "Playlist not found." };
  }

  updatePlaylist(playlistId, {
    songIds: playlist.songIds.filter((id) => id !== songId),
    updatedAt: new Date().toISOString(),
  });

  return { success: true, playlist: getPlaylistById(playlistId) };
}
