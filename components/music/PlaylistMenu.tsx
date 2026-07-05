"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  addSongToPlaylist,
  canCreatePlaylist,
  removeSongFromPlaylist,
} from "@/lib/playlists";
import { getUserById } from "@/lib/storage";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Song, SubscriptionTier } from "@/types";

interface PlaylistMenuProps {
  song: Song;
  userId: string;
  subscription: SubscriptionTier;
  className?: string;
}

export function PlaylistMenu({ song, userId, subscription, className }: PlaylistMenuProps) {
  const { playlists, refresh } = usePlaylists(userId);
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = getUserById(userId);
  const createCheck = user
    ? canCreatePlaylist(user)
    : { allowed: false, message: "Sign in to manage playlists." };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  function handleTogglePlaylist(playlistId: string, containsSong: boolean) {
    const result = containsSong
      ? removeSongFromPlaylist(playlistId, userId, song.id)
      : addSongToPlaylist(playlistId, userId, song.id);

    if (!result.success) {
      showToast(result.error ?? "Could not update playlist.", "error");
      return;
    }

    refresh();
    showToast(
      containsSong ? "Removed from playlist." : "Added to playlist.",
      "success",
    );
  }

  const limitLabel =
    subscription === "gold"
      ? "Unlimited playlists"
      : subscription === "silver"
        ? "Up to 100 playlists"
        : "Up to 6 playlists";

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Manage playlists"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="shrink-0"
      >
        ⋯
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border-default bg-bg-secondary py-2 shadow-lg">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Add to playlist
          </p>
          <p className="px-3 pb-2 text-xs text-text-muted">{limitLabel}</p>

          {playlists.length === 0 ? (
            <div className="px-3 py-2 text-sm text-text-secondary">
              <p>No playlists yet.</p>
              {createCheck.allowed ? (
                <Link
                  href="/playlists"
                  className="mt-1 inline-block text-accent-primary hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Create a playlist
                </Link>
              ) : (
                <p className="mt-1 text-xs text-accent-warning">
                  {createCheck.message}
                </p>
              )}
            </div>
          ) : (
            <ul className="max-h-48 overflow-y-auto">
              {playlists.map((playlist) => {
                const containsSong = playlist.songIds.includes(song.id);

                return (
                  <li key={playlist.id}>
                    <button
                      type="button"
                      onClick={() => handleTogglePlaylist(playlist.id, containsSong)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-hover"
                    >
                      <span className="truncate">{playlist.name}</span>
                      {containsSong && (
                        <span className="ml-2 text-xs text-accent-primary">✓</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-2 border-t border-border-default px-3 pt-2">
            <Link
              href="/playlists"
              className="text-xs text-text-muted hover:text-text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Manage playlists
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
