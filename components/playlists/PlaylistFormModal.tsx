"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface PlaylistFormModalProps {
  isOpen: boolean;
  mode: "create" | "rename";
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isSubmitting?: boolean;
  error?: string;
}

export function PlaylistFormModal({
  isOpen,
  mode,
  initialName = "",
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}: PlaylistFormModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [initialName, isOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(name);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create playlist" : "Rename playlist"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Playlist name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="My awesome playlist"
          error={error}
          autoFocus
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create"
                : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
