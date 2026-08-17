"use client";

import { useState } from "react";
import Link from "next/link";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { FollowButton } from "@/components/profile/FollowButton";
import { ProfileStatsGrid } from "@/components/profile/ProfileStatsGrid";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { canChangeAvatar, SUBSCRIPTION_LABELS } from "@/lib/profile";
import { useAuth } from "@/store/AuthContext";
import type { SubscriptionTier, User } from "@/types";

interface ProfileViewProps {
  profile: User;
  onProfileUpdated: () => void;
  onFollowChange?: () => void;
}

function getSubscriptionBadgeVariant(tier: SubscriptionTier) {
  switch (tier) {
    case "gold":
      return "warning" as const;
    case "silver":
      return "info" as const;
    default:
      return "default" as const;
  }
}

export function ProfileView({
  profile,
  onProfileUpdated,
  onFollowChange,
}: ProfileViewProps) {
  const { user: currentUser, refreshUser } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isOwnProfile = currentUser?.id === profile.id;
  const avatarLocked = isOwnProfile && !canChangeAvatar(profile.subscription);

  function handleSaved() {
    onProfileUpdated();
    if (isOwnProfile) {
      refreshUser();
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-5 sm:p-6 md:p-8">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="relative shrink-0">
              <Avatar
                src={profile.avatarUrl}
                alt={profile.displayName}
                size="2xl"
                className="mx-auto sm:mx-0"
              />
              {avatarLocked && (
                <div
                  className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-secondary text-sm"
                  title="Profile photo locked on Basic plan"
                >
                  🔒
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div>
                <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
                  {profile.displayName}
                </h1>
                <p className="mt-1 text-sm text-text-muted">@{profile.username}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant={getSubscriptionBadgeVariant(profile.subscription)}>
                  {SUBSCRIPTION_LABELS[profile.subscription]} plan
                </Badge>
                <Badge variant="default">{profile.role}</Badge>
              </div>

              {avatarLocked && (
                <p className="text-xs text-text-muted">
                  Profile photo changes require a Silver or Gold subscription.
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {isOwnProfile ? (
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    Edit profile
                  </Button>
                ) : (
                  <>
                    <FollowButton
                      targetUserId={profile.id}
                      isFollowing={profile.isFollowing}
                      onChange={onFollowChange}
                    />
                    {!currentUser && (
                      <Link href="/login" className="w-full sm:w-auto">
                        <Button variant="ghost" className="w-full">
                          Sign in to follow
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        <ProfileStatsGrid user={profile} />

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Profile details</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">
                Display name
              </dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                {profile.displayName}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">Username</dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                @{profile.username}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">
                Subscription
              </dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                {SUBSCRIPTION_LABELS[profile.subscription]}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">
                Daily streams
              </dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                {profile.dailyStreamCount}
              </dd>
            </div>
          </dl>

          {isOwnProfile && (
            <div className="mt-6 border-t border-border-default pt-4">
              <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
                Edit profile information
              </Button>
            </div>
          )}
        </Card>
      </div>

      {isOwnProfile && (
        <EditProfileModal
          user={profile}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
