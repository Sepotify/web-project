"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SongCard } from "@/components/music/SongCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { getArtistName, getDefaultCover } from "@/lib/music";
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
  const [addedSongIds, setAddedSongIds] = useState<string[]>([]);

  const targetPlaylist = addToPlaylistId ? getPlaylistById(addToPlaylistId) : undefined;
  const albums = getAlbums();
  const songs = getSongs();

  const filteredSongs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return songs;

    return songs.filter((song) => {
      const artistName = getArtistName(song.artistId).toLowerCase();
      return (
        song.title.toLowerCase().includes(normalized) ||
        artistName.includes(normalized)
      );
    });
  }, [query, songs]);

  const filteredAlbums = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return albums;

    return albums.filter((album) => {
      const artistName = getArtistName(album.artistId).toLowerCase();
      return (
        album.title.toLowerCase().includes(normalized) ||
        artistName.includes(normalized)
      );
    });
  }, [albums, query]);

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

  function handlePlaySong(songId: string) {
    const song = songs.find((item) => item.id === songId);
    if (!song) return;
    playSong(song, filteredSongs);
    showToast(`Now playing: ${song.title}`, "success");
  }

  function handlePlayAll() {
    if (filteredSongs.length === 0) return;
    playQueue(filteredSongs, 0);
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
          placeholder="Search by track or artist..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Albums</h2>
          {filteredAlbums.length === 0 ? (
            <p className="text-sm text-text-muted">No albums match your search.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAlbums.map((album) => (
                <Card key={album.id} className="p-4">
                  <div
                    className="mb-3 flex aspect-square items-center justify-center rounded-md text-2xl font-bold text-white"
                    style={{ background: getDefaultCover(album.title) }}
                  >
                    {album.title.slice(0, 1)}
                  </div>
                  <h3 className="font-semibold text-text-primary">{album.title}</h3>
                  <p className="text-sm text-text-muted">{getArtistName(album.artistId)}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {album.songIds.length} tracks
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text-primary">Tracks</h2>
            {!addToPlaylistId && filteredSongs.length > 0 && (
              <Button variant="secondary" size="sm" onClick={handlePlayAll}>
                Play all
              </Button>
            )}
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
                    onPlay={addToPlaylistId ? undefined : () => handlePlaySong(song.id)}
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
      </div>
    </AppShell>
  );
}
