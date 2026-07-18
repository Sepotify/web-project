"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile/ProfileView";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/store/AuthContext";

export default function OwnProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading, refresh } = useProfile(user?.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isLoading || !profile) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ProfileView
        profile={profile}
        onProfileUpdated={() => refresh()}
      />
    </AppShell>
  );
}
