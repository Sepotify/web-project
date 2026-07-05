"use client";

import { useState } from "react";
import { followArtist, isFollowingArtist, unfollowArtist } from "@/lib/artist";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface FollowArtistButtonProps {
  artistId: string;
  viewerUserId: string;
  onChange?: () => void;
}

export function FollowArtistButton({
  artistId,
  viewerUserId,
  onChange,
}: FollowArtistButtonProps) {
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(() =>
    isFollowingArtist(viewerUserId, artistId),
  );

  function handleClick() {
    const success = isFollowing
      ? unfollowArtist(viewerUserId, artistId)
      : followArtist(viewerUserId, artistId);

    if (!success) {
      showToast("Unable to update follow status.", "error");
      return;
    }

    setIsFollowing((current) => !current);
    onChange?.();
    showToast(isFollowing ? "Unfollowed artist." : "Now following artist.", "success");
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "primary"}
      onClick={handleClick}
      className="w-full sm:w-auto"
    >
      {isFollowing ? "Unfollow artist" : "Follow artist"}
    </Button>
  );
}
