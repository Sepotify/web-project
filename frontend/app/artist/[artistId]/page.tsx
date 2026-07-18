"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ArtistDiscography } from "@/components/artist/ArtistDiscography";
import { ArtistGoldStats } from "@/components/artist/ArtistGoldStats";
import { ArtistHeader } from "@/components/artist/ArtistHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { getArtistDiscography } from "@/lib/artist";
import { getArtistById } from "@/lib/storage";
import { useAuth } from "@/store/AuthContext";
import { usePlayer } from "@/hooks/usePlayer";
import type { Song } from "@/types";

interface ArtistProfilePageProps {
  params: Promise<{ artistId: string }>;
}

export default function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { artistId } = use(params);
  return <ArtistProfileContent artistId={artistId} />;
}

function ArtistProfileContent({ artistId }: { artistId: string }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const { playSong } = usePlayer();
  const { showToast } = useToast();

  const artist = getArtistById(artistId);
  const discography = artist ? getArtistDiscography(artist.id) : { albums: [], singles: [] };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading artist profile...</p>
        </div>
      </AppShell>
    );
  }

  if (!artist || artist.status !== "approved") {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <EmptyState
            title="Artist not found"
            description="This artist profile does not exist or is not available yet."
            icon="🎤"
          />
          <div className="mt-4 text-center">
            <Link href="/albums">
              <Button variant="secondary">Back to library</Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  function handlePlaySong(song: Song, queue: Song[]) {
    playSong(song, queue);
    showToast(`Now playing: ${song.title}`, "success");
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Link href="/albums" className="text-sm text-text-muted hover:text-text-primary">
          ← Back to library
        </Link>

        <ArtistHeader
          artist={artist}
          viewerUserId={user.id}
          onFollowChange={refreshUser}
        />

        <ArtistGoldStats artist={artist} />

        <ArtistDiscography
          albums={discography.albums}
          singles={discography.singles}
          userId={user.id}
          subscription={user.subscription}
          onPlaySong={handlePlaySong}
        />
      </div>
    </AppShell>
  );
}
