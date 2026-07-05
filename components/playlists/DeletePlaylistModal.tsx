"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface DeletePlaylistModalProps {
  isOpen: boolean;
  playlistName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeletePlaylistModal({
  isOpen,
  playlistName,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeletePlaylistModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete playlist" className="max-w-md">
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-text-secondary">
          Are you sure you want to delete{" "}
          <span className="font-medium text-text-primary">{playlistName}</span>? This
          action cannot be undone.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
