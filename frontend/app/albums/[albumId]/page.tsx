"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SongCard } from "@/components/music/SongCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { getAlbumSongs } from "@/lib/library";
import { getArtistName, getDefaultCover } from "@/lib/music";
import { getAlbumById, getSongs } from "@/lib/storage";
import { useAuth } from "@/store/AuthContext";
import { usePlayer } from "@/hooks/usePlayer";

interface AlbumDetailPageProps {
  params: Promise<{ albumId: string }>;
}

export default function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  return <AlbumDetailContent params={params} />;
}

function AlbumDetailContent({ params }: { params: Promise<{ albumId: string }> }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { playSong, playQueue } = usePlayer();
  const { showToast } = useToast();
  const [albumId, setAlbumId] = useState("");

  useEffect(() => {
    params.then(({ albumId: id }) => setAlbumId(id));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const album = albumId ? getAlbumById(albumId) : undefined;
  const albumSongs = album ? getAlbumSongs(album, getSongs()) : [];

  if (authLoading || !user || !albumId) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading album...</p>
        </div>
      </AppShell>
    );
  }

  if (!album) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-xl font-semibold text-text-primary">Album not found</h1>
          <p className="mt-2 text-sm text-text-secondary">
            This album does not exist or has been removed.
          </p>
          <Link href="/albums" className="mt-4 inline-block">
            <Button variant="secondary">Back to library</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  function handlePlaySong(songId: string) {
    const song = albumSongs.find((item) => item.id === songId);
    if (!song) return;
    playSong(song, albumSongs);
    showToast(`Now playing: ${song.title}`, "success");
  }

  function handlePlayAll() {
    if (!album || albumSongs.length === 0) return;
    playQueue(albumSongs, 0);
    showToast(`Playing album: ${album.title}`, "success");
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Link href="/albums" className="text-sm text-text-muted hover:text-text-primary">
          ← Back to library
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div
            className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg text-4xl font-bold text-white sm:h-48 sm:w-48"
            style={{ background: album.coverUrl ? undefined : getDefaultCover(album.title) }}
          >
            {album.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.coverUrl}
                alt={album.title}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              album.title.slice(0, 1)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-text-muted">Album</p>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{album.title}</h1>
            <Link
              href={`/artist/${album.artistId}`}
              className="mt-1 inline-block text-sm text-text-secondary hover:text-text-primary hover:underline"
            >
              {getArtistName(album.artistId)}
            </Link>
            <p className="mt-2 text-sm text-text-muted">
              {album.releaseYear ?? "Unknown year"}
              {album.genre ? ` · ${album.genre}` : ""}
              {` · ${albumSongs.length} tracks`}
            </p>
            {albumSongs.length > 0 && (
              <Button className="mt-4" onClick={handlePlayAll}>
                Play album
              </Button>
            )}
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Tracks</h2>
          {albumSongs.length === 0 ? (
            <p className="text-sm text-text-muted">No tracks in this album yet.</p>
          ) : (
            albumSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                userId={user.id}
                subscription={user.subscription}
                onPlay={() => handlePlaySong(song.id)}
              />
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
