import { getSingleTracks } from "@/lib/library";
import {
  getAlbums,
  getArtistById,
  getSongs,
  getUserById,
  mutateUsers,
} from "@/lib/storage";
import type { Album, Artist, Song } from "@/types";

export interface ArtistDiscography {
  albums: Album[];
  singles: Song[];
}

export function getArtistDiscography(artistId: string): ArtistDiscography {
  const albums = getAlbums()
    .filter((album) => album.artistId === artistId)
    .sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));

  const singles = getSingleTracks(getSongs())
    .filter((song) => song.artistId === artistId)
    .sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));

  return { albums, singles };
}

export function isFollowingArtist(userId: string, artistId: string): boolean {
  const user = getUserById(userId);
  return user?.followingArtistIds.includes(artistId) ?? false;
}

export function followArtist(userId: string, artistId: string): boolean {
  const artist = getArtistById(artistId);
  const user = getUserById(userId);
  if (!artist || !user || user.followingArtistIds.includes(artistId)) return false;

  mutateUsers((users) =>
    users.map((entry) =>
      entry.id === userId
        ? {
            ...entry,
            followingArtistIds: [...entry.followingArtistIds, artistId],
          }
        : entry,
    ),
  );

  return true;
}

export function unfollowArtist(userId: string, artistId: string): boolean {
  const user = getUserById(userId);
  if (!user || !user.followingArtistIds.includes(artistId)) return false;

  mutateUsers((users) =>
    users.map((entry) =>
      entry.id === userId
        ? {
            ...entry,
            followingArtistIds: entry.followingArtistIds.filter((id) => id !== artistId),
          }
        : entry,
    ),
  );

  return true;
}

export function getArtistProfileSummary(artist: Artist) {
  const { albums, singles } = getArtistDiscography(artist.id);

  return {
    albumCount: albums.length,
    singleCount: singles.length,
    isApproved: artist.status === "approved",
  };
}
