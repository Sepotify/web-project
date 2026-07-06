"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EarlyAccessSection } from "@/components/home/EarlyAccessSection";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSection } from "@/components/home/HomeSection";
import { PlaylistCard } from "@/components/home/PlaylistCard";
import { AlbumCard } from "@/components/music/AlbumCard";
import { SongCard } from "@/components/music/SongCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  HOME_ALBUM_LIMIT,
  HOME_PLAYLIST_LIMIT,
  HOME_SONG_LIMIT,
  getEarlyAccessSongs,
  getLatestAlbums,
  getPopularSongs,
} from "@/lib/home";
import { getRecentlyPlayedPlaylists, recordPlaylistPlay } from "@/lib/recent-playlists";
import { getSongById, getSongs } from "@/lib/storage";
import { canAccessEarlyAccess } from "@/lib/subscription";
import { useAuth } from "@/store/AuthContext";
import { usePlayer } from "@/hooks/usePlayer";
import type { Playlist } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { playSong, playQueue } = usePlayer();
  const { showToast } = useToast();
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);

  const latestAlbums = useMemo(() => getLatestAlbums(HOME_ALBUM_LIMIT), []);
  const popularSongs = useMemo(() => getPopularSongs(HOME_SONG_LIMIT), []);
  const earlyAccessSongs = useMemo(() => getEarlyAccessSongs(), []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user?.role === "listener") {
      setRecentPlaylists(getRecentlyPlayedPlaylists(user.id, HOME_PLAYLIST_LIMIT));
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading home...</p>
        </div>
      </AppShell>
    );
  }

  const userId = user.id;
  const showRecentPlaylists = user.role === "listener";
  const showEarlyAccess =
    canAccessEarlyAccess(user.subscription) && earlyAccessSongs.length > 0;

  function handlePlayPlaylist(playlist: Playlist) {
    const songs = playlist.songIds
      .map((songId) => getSongById(songId))
      .filter((song): song is NonNullable<typeof song> => Boolean(song));

    if (songs.length === 0) {
      showToast("This playlist has no playable songs yet.", "error");
      return;
    }

    recordPlaylistPlay(userId, playlist.id);
    playQueue(songs, 0);
    setRecentPlaylists(getRecentlyPlayedPlaylists(userId, HOME_PLAYLIST_LIMIT));
    showToast(`Playing: ${playlist.name}`, "success");
  }

  function handlePlaySong(songId: string, queue = popularSongs) {
    const allSongs = getSongs();
    const song = allSongs.find((item) => item.id === songId);
    if (!song) return;

    playSong(song, queue);
    showToast(`Now playing: ${song.title}`, "success");
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-10">
        <HomeHeader user={user} />

        {showRecentPlaylists && (
          <HomeSection
            title="Recently played playlists"
            seeAllHref="/playlists"
            seeAllLabel="Your playlists"
          >
            {recentPlaylists.length === 0 ? (
              <EmptyState
                title="No recent playlists yet"
                description="Play a playlist from your library and it will show up here."
                actionLabel="Go to playlists"
                onAction={() => router.push("/playlists")}
                className="rounded-lg border border-dashed border-border-default bg-bg-elevated py-10"
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {recentPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onPlay={() => handlePlayPlaylist(playlist)}
                  />
                ))}
              </div>
            )}
          </HomeSection>
        )}

        <HomeSection title="Latest releases" seeAllHref="/albums" seeAllLabel="Browse all">
          {latestAlbums.length === 0 ? (
            <p className="text-sm text-text-muted">No albums have been published yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {latestAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </HomeSection>

        <HomeSection title="Popular right now" seeAllHref="/albums" seeAllLabel="See all tracks">
          {popularSongs.length === 0 ? (
            <p className="text-sm text-text-muted">No tracks available yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {popularSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  userId={userId}
                  subscription={user.subscription}
                  onPlay={() => handlePlaySong(song.id)}
                />
              ))}
            </div>
          )}
        </HomeSection>

        {showEarlyAccess && (
          <EarlyAccessSection>
            <div className="flex flex-col gap-2">
              {earlyAccessSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  userId={userId}
                  subscription={user.subscription}
                  onPlay={() => handlePlaySong(song.id, earlyAccessSongs)}
                />
              ))}
            </div>
          </EarlyAccessSection>
        )}

        {showRecentPlaylists && recentPlaylists.length === 0 && latestAlbums.length > 0 && (
          <div className="rounded-lg border border-border-default bg-bg-elevated p-4 text-center sm:p-5">
            <p className="text-sm text-text-secondary">
              Discover new music in the latest releases, or build a playlist to get started.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Link href="/playlists">
                <Button size="sm">Create a playlist</Button>
              </Link>
              <Link href="/albums">
                <Button size="sm" variant="secondary">
                  Browse albums
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
