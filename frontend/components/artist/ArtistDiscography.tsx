"use client";

import { AlbumCard } from "@/components/music/AlbumCard";
import { SongCard } from "@/components/music/SongCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Album, Song, SubscriptionTier } from "@/types";

interface ArtistDiscographyProps {
  albums: Album[];
  singles: Song[];
  userId: string;
  subscription: SubscriptionTier;
  onPlaySong: (song: Song, queue: Song[]) => void;
}

export function ArtistDiscography({
  albums,
  singles,
  userId,
  subscription,
  onPlaySong,
}: ArtistDiscographyProps) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Albums</h2>
        {albums.length === 0 ? (
          <EmptyState
            title="No albums yet"
            description="This artist has not released any albums."
            icon="💿"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Singles</h2>
        {singles.length === 0 ? (
          <EmptyState
            title="No singles yet"
            description="This artist has not released any standalone tracks."
            icon="🎵"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {singles.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                userId={userId}
                subscription={subscription}
                onPlay={() => onPlaySong(song, singles)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
