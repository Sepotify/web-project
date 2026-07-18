import { addAlbum, addSong } from "@/lib/storage";
import { notifyFollowersOfNewRelease } from "@/lib/notification-events";
import type { Album, Song } from "@/types";

export function releaseSong(song: Song): Song {
  addSong(song);

  notifyFollowersOfNewRelease(song.artistId, {
    title: song.title,
    link: song.albumId ? `/albums/${song.albumId}` : "/albums",
    releaseLabel: song.albumId ? "track" : "single",
  });

  return song;
}

export function releaseAlbum(album: Album): Album {
  addAlbum(album);

  notifyFollowersOfNewRelease(album.artistId, {
    title: album.title,
    link: `/albums/${album.id}`,
    releaseLabel: "album",
  });

  return album;
}
