"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface RejectArtistModalProps {
  isOpen: boolean;
  artistName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export function RejectArtistModal({
  isOpen,
  artistName,
  onClose,
  onConfirm,
  isSubmitting = false,
}: RejectArtistModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  function handleClose() {
    setReason("");
    setError(undefined);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reason.trim()) {
      setError("Rejection reason is required.");
      return;
    }

    onConfirm(reason.trim());
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject artist application" className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-text-secondary">
          Provide a reason for rejecting{" "}
          <span className="font-medium text-text-primary">{artistName}</span>. The artist will
          receive this message in their notification.
        </p>

        <Textarea
          label="Rejection reason"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            if (error) setError(undefined);
          }}
          placeholder="Explain what needs to improve before approval..."
          error={error}
          required
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="danger" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Rejecting..." : "Reject application"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
