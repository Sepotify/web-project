"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import {
  canChangeAvatar,
  updateProfile,
  validateUpdateProfileInput,
  type UpdateProfileErrors,
} from "@/lib/profile";
import type { User } from "@/types";

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({
  user,
  isOpen,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const { showToast } = useToast();
  const avatarEditable = canChangeAvatar(user.subscription);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [errors, setErrors] = useState<UpdateProfileErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(user.displayName);
    setAvatarPreview(user.avatarUrl);
    setAvatarFile(null);
    setAvatarChanged(false);
    setErrors({});
  }, [isOpen, user]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    if (!avatarEditable) return;

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        avatarUrl: "Please select a valid image file.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      setAvatarFile(file);
      setAvatarChanged(true);
      setErrors((prev) => ({ ...prev, avatarUrl: undefined }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = {
      displayName,
      avatarUrl: avatarChanged ? avatarPreview ?? null : undefined,
      avatarFile: avatarChanged ? avatarFile : undefined,
    };

    const validationErrors = validateUpdateProfileInput(input, user.subscription);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const result = await updateProfile(user.id, input);
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      if (result.errors) setErrors(result.errors);
      showToast(result.error ?? "Failed to update profile.", "error");
      return;
    }

    showToast("Profile updated successfully.", "success");
    onSaved();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile" className="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar src={avatarPreview} alt={displayName} size="xl" />
            {!avatarEditable && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xl"
                aria-hidden="true"
                title="Locked for Basic plan"
              >
                🔒
              </div>
            )}
          </div>

          <div className="w-full">
            <label
              htmlFor="avatar-upload"
              className={`flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border-default p-4 text-center ${
                avatarEditable
                  ? "cursor-pointer hover:border-accent-primary hover:bg-bg-hover"
                  : "cursor-not-allowed opacity-60"
              }`}
            >
              <span className="text-sm font-medium text-text-primary">
                {avatarEditable ? "Change profile photo" : "Profile photo locked"}
              </span>
              <span className="text-xs text-text-muted">
                {avatarEditable
                  ? "Upload a JPG or PNG image"
                  : "Upgrade to Silver or Gold to change your profile photo"}
              </span>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!avatarEditable}
                onChange={handleAvatarChange}
              />
            </label>
            {errors.avatarUrl && (
              <p className="mt-1 text-xs text-accent-danger">{errors.avatarUrl}</p>
            )}
          </div>
        </div>

        <Input
          label="Display name"
          name="displayName"
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            if (errors.displayName) {
              setErrors((prev) => ({ ...prev, displayName: undefined }));
            }
          }}
          error={errors.displayName}
        />

        <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
          <p className="text-xs text-text-muted">Username (system-assigned)</p>
          <p className="text-sm font-medium text-text-primary">@{user.username}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
