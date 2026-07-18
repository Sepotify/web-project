"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile/ProfileView";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProfile } from "@/hooks/useProfile";

interface UserProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = use(params);
  const { profile, isLoading, refresh } = useProfile(userId);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <EmptyState
          title="User not found"
          description="This profile does not exist or may have been removed."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ProfileView profile={profile} onProfileUpdated={refresh} onFollowChange={refresh} />
    </AppShell>
  );
}
