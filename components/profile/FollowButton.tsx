"use client";

import { Button } from "@/components/ui/Button";
import { followUser, isFollowingUser, unfollowUser } from "@/lib/profile";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface FollowButtonProps {
  targetUserId: string;
  onChange?: () => void;
}

export function FollowButton({ targetUserId, onChange }: FollowButtonProps) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  if (!user || user.id === targetUserId) return null;

  const isFollowing = isFollowingUser(user.id, targetUserId);

  function handleClick() {
    if (!user) return;

    const success = isFollowing
      ? unfollowUser(user.id, targetUserId)
      : followUser(user.id, targetUserId);

    if (!success) {
      showToast("Unable to update follow status.", "error");
      return;
    }

    refreshUser();
    onChange?.();
    showToast(isFollowing ? "Unfollowed user." : "Now following user.", "success");
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "primary"}
      onClick={handleClick}
      className="w-full sm:w-auto"
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
