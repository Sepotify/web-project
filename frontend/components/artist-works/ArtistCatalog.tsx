"use client";

import { useState } from "react";
import { WorkStatsGrid } from "@/components/artist-works/WorkStatsGrid";
import { DeleteWorkModal } from "@/components/artist-works/DeleteWorkModal";
import { EditWorkModal } from "@/components/artist-works/EditWorkModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SongCard } from "@/components/music/SongCard";
import {
  deleteArtistAlbumRequest,
  deleteArtistSongRequest,
  formatFeaturedArtistNames,
  getAlbumStats,
  getSongStats,
} from "@/lib/catalog";
import { getDefaultCover } from "@/lib/music";
import { getAlbumSongs } from "@/lib/library";
import { getSongs } from "@/lib/storage";
import { useAuth } from "@/store/AuthContext";
import type { Album, Song, SubscriptionTier } from "@/types";

interface ArtistCatalogProps {
  artistId: string;
  albums: Album[];
  singles: Song[];
  userId: string;
  subscription: SubscriptionTier;
  onChanged: () => void;
  onPlaySong: (song: Song, queue: Song[]) => void;
}

export function ArtistCatalog({
  artistId,
  albums,
  singles,
  userId,
  subscription,
  onChanged,
  onPlaySong,
}: ArtistCatalogProps) {
  const { useApiAuth } = useAuth();
  const [editTarget, setEditTarget] = useState<
    { type: "single"; song: Song } | { type: "album"; album: Album } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "single"; song: Song } | { type: "album"; album: Album } | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const allSongs = getSongs();

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setIsDeleting(true);

    const removed =
      deleteTarget.type === "album"
        ? await deleteArtistAlbumRequest(artistId, deleteTarget.album.id, useApiAuth)
        : await deleteArtistSongRequest(artistId, deleteTarget.song.id, useApiAuth);

    setIsDeleting(false);

    if (removed) {
      setDeleteTarget(null);
      onChanged();
    }
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-text-primary">Albums</h3>
          {albums.length === 0 ? (
            <EmptyState
              title="No albums yet"
              description="Publish an album to see it here."
              icon="💿"
              className="rounded-lg border border-dashed border-border-default bg-bg-elevated py-8"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {albums.map((album) => {
                const stats = getAlbumStats(album);
                const tracks = getAlbumSongs(album, allSongs);

                return (
                  <Card key={album.id} className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div
                        className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md text-2xl font-bold text-white"
                        style={{
                          background: album.coverUrl
                            ? undefined
                            : getDefaultCover(album.title),
                        }}
                      >
                        {album.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={album.coverUrl}
                            alt={album.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          album.title.slice(0, 1)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-text-primary">
                              {album.title}
                            </h4>
                            <p className="mt-1 text-sm text-text-muted">
                              {album.genre ?? "Unknown genre"}
                              {album.releaseYear ? ` · ${album.releaseYear}` : ""}
                              {` · ${tracks.length} tracks`}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditTarget({ type: "album", album })}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-accent-danger"
                              onClick={() => setDeleteTarget({ type: "album", album })}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <WorkStatsGrid stats={stats} />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-text-primary">Singles</h3>
          {singles.length === 0 ? (
            <EmptyState
              title="No singles yet"
              description="Publish a single to see it here."
              icon="🎵"
              className="rounded-lg border border-dashed border-border-default bg-bg-elevated py-8"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {singles.map((song) => {
                const stats = getSongStats(song);

                return (
                  <Card key={song.id} className="p-4">
                    <SongCard
                      song={song}
                      userId={userId}
                      subscription={subscription}
                      showPlaylistMenu={false}
                      onPlay={() => onPlaySong(song, singles)}
                    />

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-text-muted">
                        {song.genre ?? "Unknown genre"}
                        {song.releaseYear ? ` · ${song.releaseYear}` : ""}
                        {song.featuredArtistIds.length > 0 &&
                          ` · Feat. ${formatFeaturedArtistNames(song.featuredArtistIds)}`}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditTarget({ type: "single", song })}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-accent-danger"
                          onClick={() => setDeleteTarget({ type: "single", song })}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <WorkStatsGrid stats={stats} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <EditWorkModal
        isOpen={Boolean(editTarget)}
        target={editTarget}
        artistId={artistId}
        onClose={() => setEditTarget(null)}
        onSaved={onChanged}
      />

      <DeleteWorkModal
        isOpen={Boolean(deleteTarget)}
        workTitle={
          deleteTarget?.type === "album"
            ? deleteTarget.album.title
            : (deleteTarget?.song.title ?? "")
        }
        workType={deleteTarget?.type === "album" ? "album" : "single"}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
        isDeleting={isDeleting}
      />
    </>
  );
}
