"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface DeleteWorkModalProps {
  isOpen: boolean;
  workTitle: string;
  workType: "single" | "album";
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteWorkModal({
  isOpen,
  workTitle,
  workType,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteWorkModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delete ${workType}`} className="max-w-md">
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-text-secondary">
          Are you sure you want to delete{" "}
          <span className="font-medium text-text-primary">{workTitle}</span>?
          {workType === "album" && " All tracks in this album will also be removed."}
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
