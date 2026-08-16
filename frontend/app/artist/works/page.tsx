"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ArtistCatalog } from "@/components/artist-works/ArtistCatalog";
import { ReleaseWorkForm } from "@/components/artist-works/ReleaseWorkForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { getArtistDiscography } from "@/lib/artist";
import { fetchArtistDiscography } from "@/lib/catalog";
import { getArtistByUserId } from "@/lib/storage";
import { useAuth } from "@/store/AuthContext";
import { usePlayer } from "@/hooks/usePlayer";
import type { ReleaseType } from "@/lib/publish";
import type { Album, Artist, Song } from "@/types";

export default function ArtistWorksPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, useApiAuth } = useAuth();
  const { playSong } = usePlayer();
  const { showToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [singles, setSingles] = useState<Song[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const localArtist = user ? getArtistByUserId(user.id) : undefined;
  const artist: Artist | undefined = localArtist
    ? localArtist
    : user?.role === "artist" && user.artistProfileId
      ? {
          id: user.artistProfileId,
          userId: user.id,
          stageName: user.artistStageName ?? user.displayName,
          status: user.artistStatus ?? "pending",
          rejectionReason: user.artistRejectionReason,
          isVerified: user.artistStatus === "approved",
          totalListeners: 0,
          totalStreams: 0,
          createdAt: user.createdAt,
        }
      : undefined;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!authLoading && user && user.role !== "artist") {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router, user]);

  useEffect(() => {
    if (!artist || artist.status !== "approved") {
      setCatalogLoading(false);
      return;
    }

    const artistId = artist.id;
    let cancelled = false;

    async function load() {
      setCatalogLoading(true);
      const discography = useApiAuth
        ? await fetchArtistDiscography(artistId, true)
        : getArtistDiscography(artistId);
      if (!cancelled) {
        setAlbums(discography.albums);
        setSingles(discography.singles);
        setCatalogLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [artist?.id, artist?.status, refreshKey, useApiAuth]);

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading artist works...</p>
        </div>
      </AppShell>
    );
  }

  if (!artist) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-xl font-semibold text-text-primary">Artist profile not found</h1>
          <p className="mt-2 text-sm text-text-secondary">
            We could not find an artist profile linked to your account.
          </p>
        </div>
      </AppShell>
    );
  }

  if (artist.status === "pending") {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-xl font-semibold text-text-primary">Approval pending</h1>
          <p className="mt-2 text-sm text-text-secondary">
            You can publish music after your artist account is approved.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push("/register/pending")}>
            View application status
          </Button>
        </div>
      </AppShell>
    );
  }

  if (artist.status === "rejected") {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-xl font-semibold text-text-primary">Application rejected</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {artist.rejectionReason ?? "Your artist application was not approved."}
          </p>
        </div>
      </AppShell>
    );
  }

  function handlePublished(releaseType: ReleaseType) {
    setRefreshKey((value) => value + 1);
    showToast(
      releaseType === "single" ? "Single published successfully." : "Album published successfully.",
      "success",
    );
  }

  function handleCatalogChanged() {
    setRefreshKey((value) => value + 1);
    showToast("Catalog updated.", "success");
  }

  function handlePlaySong(song: Song, queue: Song[]) {
    playSong(song, queue);
    showToast(`Now playing: ${song.title}`, "success");
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">My works</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Publish singles or albums, then manage stats and metadata for each release.
          </p>
        </div>

        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Publish new release</h2>
          <ReleaseWorkForm artistId={artist.id} onPublished={handlePublished} />
        </Card>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-text-primary">Your catalog</h2>
          {catalogLoading ? (
            <p className="text-sm text-text-secondary">Loading catalog...</p>
          ) : (
            <ArtistCatalog
              artistId={artist.id}
              albums={albums}
              singles={singles}
              subscription={user.subscription}
              userId={user.id}
              onChanged={handleCatalogChanged}
              onPlaySong={handlePlaySong}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
