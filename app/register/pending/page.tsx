"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getRedirectPathForUser } from "@/lib/auth";
import { getArtistByUserId } from "@/lib/storage";
import { useAuth } from "@/store/AuthContext";
import type { Artist } from "@/types";

export default function ArtistPendingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "artist") {
      router.replace(getRedirectPathForUser(user));
      return;
    }

    const artistProfile = getArtistByUserId(user.id);
    if (!artistProfile) {
      router.replace("/");
      return;
    }

    if (artistProfile.status === "approved") {
      router.replace("/");
      return;
    }

    setArtist(artistProfile);
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || !user || !artist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Application under review"
      subtitle="Your artist account is waiting for approval"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-border-default bg-bg-elevated p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">Status</span>
            <Badge variant="warning">Pending approval</Badge>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">Stage name</dt>
              <dd className="font-medium text-text-primary">{artist.stageName}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Email</dt>
              <dd className="font-medium text-text-primary">{user.email}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="mb-1 text-sm text-text-muted">Portfolio / sample works</p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">
              {artist.portfolioUrl}
            </p>
          </div>
        </div>

        <p className="text-sm leading-6 text-text-secondary">
          Our support team will review your application. You will receive a notification
          once your artist account is approved or rejected.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/" className="flex-1">
            <Button variant="secondary" className="w-full">
              Go to home
            </Button>
          </Link>
          <Button variant="ghost" className="flex-1" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
