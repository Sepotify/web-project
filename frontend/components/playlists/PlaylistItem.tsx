"use client";

import Link from "next/link";
import { SongCard } from "@/components/music/SongCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { recordPlaylistPlay } from "@/lib/recent-playlists";
import { removeSongFromPlaylist } from "@/lib/playlists";
import { getSongById } from "@/lib/storage";
import { usePlayer } from "@/hooks/usePlayer";
import type { Playlist } from "@/types";

interface PlaylistItemProps {
  playlist: Playlist;
  userId: string;
  onRename: (playlist: Playlist) => void;
  onDelete: (playlist: Playlist) => void;
  onChanged: () => void;
}

export function PlaylistItem({
  playlist,
  userId,
  onRename,
  onDelete,
  onChanged,
}: PlaylistItemProps) {
  const { playSong, playQueue } = usePlayer();
  const { showToast } = useToast();

  const songs = playlist.songIds
    .map((songId) => getSongById(songId))
    .filter((song): song is NonNullable<typeof song> => Boolean(song));

  function handlePlaySong(songId: string) {
    const song = songs.find((item) => item.id === songId);
    if (!song) return;

    recordPlaylistPlay(userId, playlist.id);
    playSong(song, songs);
    showToast(`Now playing: ${song.title}`, "success");
  }

  function handlePlayAll() {
    if (songs.length === 0) return;

    recordPlaylistPlay(userId, playlist.id);
    playQueue(songs, 0);
    showToast(`Playing: ${playlist.name}`, "success");
  }

  function handleRemoveSong(songId: string) {
    removeSongFromPlaylist(playlist.id, userId, songId);
    onChanged();
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-text-primary">
            {playlist.name}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {songs.length} {songs.length === 1 ? "song" : "songs"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {songs.length > 0 && (
            <Button size="sm" variant="primary" onClick={handlePlayAll}>
              Play all
            </Button>
          )}
          <Link href={`/albums?addTo=${playlist.id}`}>
            <Button size="sm" variant="primary">
              Add songs
            </Button>
          </Link>
          <Button size="sm" variant="secondary" onClick={() => onRename(playlist)}>
            Rename
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(playlist)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {songs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-default px-4 py-6 text-center text-sm text-text-muted">
            No songs yet. Use &quot;Add songs&quot; to browse albums and tracks.
          </p>
        ) : (
          songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              compact
              onPlay={() => handlePlaySong(song.id)}
              actionLabel="Remove"
              onAction={() => handleRemoveSong(song.id)}
            />
          ))
        )}
      </div>
    </Card>
  );
}
