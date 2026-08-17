"use client";

import { useEffect, useState } from "react";
import { followArtist, isFollowingArtist, unfollowArtist } from "@/lib/artist";
import { ApiError } from "@/lib/api/client";
import {
  apiFetchArtist,
  apiFollowArtist,
  apiUnfollowArtist,
} from "@/lib/api/endpoints";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/store/AuthContext";

interface FollowArtistButtonProps {
  artistId: string;
  viewerUserId: string;
  onChange?: () => void;
}

/** Backend artist ids are numeric; Phase-1 mock ids look like "artist-1". */
function isApiArtistId(id: string): boolean {
  return /^\d+$/.test(id);
}

export function FollowArtistButton({
  artistId,
  viewerUserId,
  onChange,
}: FollowArtistButtonProps) {
  const { showToast } = useToast();
  const { useApiAuth } = useAuth();
  const viaApi = useApiAuth && isApiArtistId(artistId);
  const [isFollowing, setIsFollowing] = useState(() =>
    isFollowingArtist(viewerUserId, artistId),
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!viaApi) return;
    let cancelled = false;
    void apiFetchArtist(artistId)
      .then((artist) => {
        if (!cancelled) setIsFollowing(artist.is_following ?? false);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [artistId, viaApi]);

  async function handleClick() {
    if (pending) return;
    setPending(true);

    const wasFollowing = isFollowing;
    let success = false;

    if (viaApi) {
      try {
        const result = wasFollowing
          ? await apiUnfollowArtist(artistId)
          : await apiFollowArtist(artistId);
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
        ? unfollowArtist(viewerUserId, artistId)
        : followArtist(viewerUserId, artistId);
    }

    setPending(false);
    if (!success) {
      showToast("Unable to update follow status.", "error");
      return;
    }

    setIsFollowing(!wasFollowing);
    onChange?.();
    showToast(wasFollowing ? "Unfollowed artist." : "Now following artist.", "success");
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "primary"}
      onClick={handleClick}
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {isFollowing ? "Unfollow artist" : "Follow artist"}
    </Button>
  );
}
