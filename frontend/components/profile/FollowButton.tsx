"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { apiFollowUser, apiUnfollowUser } from "@/lib/api/endpoints";
import { followUser, isFollowingUser, unfollowUser } from "@/lib/profile";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface FollowButtonProps {
  targetUserId: string;
  /** Follow state reported by the API profile (used when API auth is active). */
  isFollowing?: boolean;
  onChange?: () => void;
}

export function FollowButton({ targetUserId, isFollowing, onChange }: FollowButtonProps) {
  const { user, refreshUser, useApiAuth } = useAuth();
  const { showToast } = useToast();
  const [following, setFollowing] = useState(
    isFollowing ?? (user ? isFollowingUser(user.id, targetUserId) : false),
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isFollowing !== undefined) {
      setFollowing(isFollowing);
    }
  }, [isFollowing]);

  if (!user || user.id === targetUserId) return null;

  async function handleClick() {
    if (!user || pending) return;
    setPending(true);

    const wasFollowing = following;
    let success = false;

    if (useApiAuth) {
      try {
        const result = wasFollowing
          ? await apiUnfollowUser(targetUserId)
          : await apiFollowUser(targetUserId);
        success = result.success;
      } catch (error) {
        setPending(false);
        showToast(
          error instanceof ApiError ? error.message : "Unable to update follow status.",
          "error",
        );
        return;
      }
    } else {
      success = wasFollowing
        ? unfollowUser(user.id, targetUserId)
        : followUser(user.id, targetUserId);
    }

    setPending(false);
    if (!success) {
      showToast("Unable to update follow status.", "error");
      return;
    }

    setFollowing(!wasFollowing);
    void refreshUser();
    onChange?.();
    showToast(wasFollowing ? "Unfollowed user." : "Now following user.", "success");
  }

  return (
    <Button
      variant={following ? "secondary" : "primary"}
      onClick={handleClick}
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {following ? "Unfollow" : "Follow"}
    </Button>
  );
}
