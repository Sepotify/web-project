"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface DeleteAccountModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteAccountModal({
  isOpen,
  email,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText.trim().toLowerCase() === "delete";

  function handleClose() {
    setConfirmText("");
    onClose();
  }

  function handleConfirm() {
    if (!isConfirmed) return;
    onConfirm();
    setConfirmText("");
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete account"
      className="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-text-secondary">
          This action is permanent. Your profile, playlists, and account data for{" "}
          <span className="font-medium text-text-primary">{email}</span> will be
          removed from this device.
        </p>

        <Input
          label='Type "DELETE" to confirm'
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder="DELETE"
          autoComplete="off"
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
