"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DeletePlaylistModal } from "@/components/playlists/DeletePlaylistModal";
import { PlaylistFormModal } from "@/components/playlists/PlaylistFormModal";
import { PlaylistItem } from "@/components/playlists/PlaylistItem";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { usePlaylists } from "@/hooks/usePlaylists";
import {
  canCreatePlaylist,
  createPlaylist,
  getPlaylistLimitInfo,
  renamePlaylist,
  removePlaylist,
} from "@/lib/playlists";
import { useAuth } from "@/store/AuthContext";
import type { Playlist } from "@/types";

export default function PlaylistsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { playlists, isLoading, refresh } = usePlaylists(user?.id);
  const { showToast } = useToast();

  const [formMode, setFormMode] = useState<"create" | "rename" | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isLoading || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading playlists...</p>
        </div>
      </AppShell>
    );
  }

  const limitInfo = getPlaylistLimitInfo(user);
  const createCheck = canCreatePlaylist(user);

  function openCreateModal() {
    setFormError(undefined);
    setActivePlaylist(null);
    setFormMode("create");
  }

  function openRenameModal(playlist: Playlist) {
    setFormError(undefined);
    setActivePlaylist(playlist);
    setFormMode("rename");
  }

  function closeFormModal() {
    setFormMode(null);
    setActivePlaylist(null);
    setFormError(undefined);
  }

  function handleFormSubmit(name: string) {
    if (!user) return;

    setIsSubmitting(true);

    const result =
      formMode === "create"
        ? createPlaylist(user, name)
        : activePlaylist
          ? renamePlaylist(activePlaylist.id, user.id, name)
          : { success: false, error: "Playlist not found." };

    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    showToast(
      formMode === "create" ? "Playlist created." : "Playlist renamed.",
      "success",
    );
    refresh();
    closeFormModal();
  }

  function handleDeleteConfirm() {
    if (!user || !deleteTarget) return;

    setIsDeleting(true);
    const result = removePlaylist(deleteTarget.id, user.id);
    setIsDeleting(false);

    if (!result.success) {
      showToast(result.error ?? "Failed to delete playlist.", "error");
      return;
    }

    showToast("Playlist deleted.", "success");
    setDeleteTarget(null);
    refresh();
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
              Your playlists
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Create, rename, and manage your playlists.
            </p>
            <p className="mt-2 text-xs text-text-muted">{limitInfo.label}</p>
          </div>

          <Button
            onClick={openCreateModal}
            disabled={!createCheck.allowed}
            className="w-full sm:w-auto"
          >
            Create playlist
          </Button>
        </div>

        {!createCheck.allowed && (
          <div className="rounded-lg border border-accent-warning/40 bg-accent-warning/10 px-4 py-3 text-sm text-accent-warning">
            {createCheck.message}{" "}
            <Link href="/payment" className="font-medium underline underline-offset-2">
              Upgrade your plan
            </Link>
          </div>
        )}

        {playlists.length === 0 ? (
          <EmptyState
            icon="🎵"
            title="No playlists yet"
            description="Create your first playlist and start adding songs from the music library."
            actionLabel={createCheck.allowed ? "Create your first playlist" : undefined}
            onAction={createCheck.allowed ? openCreateModal : undefined}
            className="rounded-xl border border-border-default bg-bg-secondary"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {playlists.map((playlist) => (
              <PlaylistItem
                key={playlist.id}
                playlist={playlist}
                userId={user.id}
                onRename={openRenameModal}
                onDelete={setDeleteTarget}
                onChanged={refresh}
              />
            ))}
          </div>
        )}
      </div>

      <PlaylistFormModal
        isOpen={formMode !== null}
        mode={formMode === "rename" ? "rename" : "create"}
        initialName={activePlaylist?.name ?? ""}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={formError}
      />

      <DeletePlaylistModal
        isOpen={Boolean(deleteTarget)}
        playlistName={deleteTarget?.name ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </AppShell>
  );
}
