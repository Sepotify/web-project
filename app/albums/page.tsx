"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AlbumCard } from "@/components/music/AlbumCard";
import { SongCard } from "@/components/music/SongCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import {
  ALBUM_SORT_OPTIONS,
  getSingleTracks,
  searchAlbums,
  searchSongs,
  SONG_SORT_OPTIONS,
  sortAlbums,
  sortSongs,
  type AlbumSortOption,
  type SongSortOption,
} from "@/lib/library";
import { addSongToPlaylist } from "@/lib/playlists";
import { getAlbums, getPlaylistById, getSongs } from "@/lib/storage";
import { useAuth } from "@/store/AuthContext";
import { usePlayer } from "@/hooks/usePlayer";

export default function AlbumsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-text-secondary">Loading library...</p>
          </div>
        </AppShell>
      }
    >
      <AlbumsPageContent />
    </Suspense>
  );
}

function AlbumsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToPlaylistId = searchParams.get("addTo");
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { playSong, playQueue } = usePlayer();

  const [query, setQuery] = useState("");
  const [albumSort, setAlbumSort] = useState<AlbumSortOption>("newest");
  const [songSort, setSongSort] = useState<SongSortOption>("newest");
  const [addedSongIds, setAddedSongIds] = useState<string[]>([]);

  const targetPlaylist = addToPlaylistId ? getPlaylistById(addToPlaylistId) : undefined;
  const albums = getAlbums();
  const songs = getSongs();

  const filteredAlbums = useMemo(() => {
    const searched = searchAlbums(albums, query);
    return sortAlbums(searched, albumSort);
  }, [albums, query, albumSort]);

  const filteredSongs = useMemo(() => {
    const searched = searchSongs(songs, query);
    return sortSongs(searched, songSort);
  }, [songs, query, songSort]);

  const singleTracks = useMemo(() => getSingleTracks(filteredSongs), [filteredSongs]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (targetPlaylist) {
      setAddedSongIds(targetPlaylist.songIds);
    }
  }, [targetPlaylist]);

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading library...</p>
        </div>
      </AppShell>
    );
  }

  if (addToPlaylistId && (!targetPlaylist || targetPlaylist.userId !== user.id)) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-xl font-semibold text-text-primary">Playlist not found</h1>
          <p className="mt-2 text-sm text-text-secondary">
            The playlist you are trying to add songs to does not exist.
          </p>
          <Link href="/playlists" className="mt-4 inline-block">
            <Button variant="secondary">Back to playlists</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  function handlePlaySong(songId: string, queue = filteredSongs) {
    const song = songs.find((item) => item.id === songId);
    if (!song) return;
    playSong(song, queue);
    showToast(`Now playing: ${song.title}`, "success");
  }

  function handlePlayAll(trackList = filteredSongs) {
    if (trackList.length === 0) return;
    playQueue(trackList, 0);
    showToast("Playing all tracks", "success");
  }

  function handleAddSong(songId: string) {
    if (!addToPlaylistId || !user) return;

    const result = addSongToPlaylist(addToPlaylistId, user.id, songId);
    if (!result.success) {
      showToast(result.error ?? "Could not add song.", "error");
      return;
    }

    setAddedSongIds((prev) => [...prev, songId]);
    showToast("Song added to playlist.", "success");
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
              Albums & tracks
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Browse the music library to discover albums and singles.
            </p>
            {targetPlaylist && (
              <p className="mt-2 text-sm text-accent-primary">
                Adding songs to: <span className="font-medium">{targetPlaylist.name}</span>
              </p>
            )}
          </div>

          <Link href="/playlists">
            <Button variant="secondary" className="w-full sm:w-auto">
              Back to playlists
            </Button>
          </Link>
        </div>

        <Input
          label="Search"
          placeholder="Search by track, album, or artist..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Albums</h2>
            <Select
              label="Sort albums"
              value={albumSort}
              onChange={(event) => setAlbumSort(event.target.value as AlbumSortOption)}
              options={ALBUM_SORT_OPTIONS}
              className="sm:max-w-xs"
            />
          </div>

          {filteredAlbums.length === 0 ? (
            <p className="text-sm text-text-muted">No albums match your search.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <h2 className="text-lg font-semibold text-text-primary">All tracks</h2>
              {!addToPlaylistId && filteredSongs.length > 0 && (
                <Button variant="secondary" size="sm" onClick={() => handlePlayAll()}>
                  Play all
                </Button>
              )}
            </div>
            <Select
              label="Sort tracks"
              value={songSort}
              onChange={(event) => setSongSort(event.target.value as SongSortOption)}
              options={SONG_SORT_OPTIONS}
              className="sm:max-w-xs"
            />
          </div>

          {filteredSongs.length === 0 ? (
            <p className="text-sm text-text-muted">No tracks match your search.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSongs.map((song) => {
                const isAdded = addedSongIds.includes(song.id);

                return (
                  <SongCard
                    key={song.id}
                    song={song}
                    userId={user.id}
                    subscription={user.subscription}
                    showPlaylistMenu={!addToPlaylistId}
                    onPlay={
                      addToPlaylistId ? undefined : () => handlePlaySong(song.id)
                    }
                    actionLabel={
                      addToPlaylistId
                        ? isAdded
                          ? "Added"
                          : "Add"
                        : undefined
                    }
                    onAction={
                      addToPlaylistId && !isAdded
                        ? () => handleAddSong(song.id)
                        : undefined
                    }
                    actionDisabled={isAdded}
                  />
                );
              })}
            </div>
          )}
        </section>

        {!addToPlaylistId && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-text-primary">Singles</h2>
              {singleTracks.length > 0 && (
                <Button variant="secondary" size="sm" onClick={() => handlePlayAll(singleTracks)}>
                  Play singles
                </Button>
              )}
            </div>

            {singleTracks.length === 0 ? (
              <p className="text-sm text-text-muted">No singles match your search.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {singleTracks.map((song) => (
                  <SongCard
                    key={`single-${song.id}`}
                    song={song}
                    userId={user.id}
                    subscription={user.subscription}
                    onPlay={() => handlePlaySong(song.id, singleTracks)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
