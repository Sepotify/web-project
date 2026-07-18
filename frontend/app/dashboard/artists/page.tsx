"use client";
import { ArtistApprovalsTable } from "@/components/dashboard/ArtistApprovalsTable";
import { getPendingArtistApplications } from "@/lib/dashboard";

export default function ArtistApprovalsPage() {
  const applications = getPendingArtistApplications();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Artist approvals</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review pending artist applications and open portfolio samples before approving.
        </p>
      </div>

      <ArtistApprovalsTable applications={applications} />
    </div>
  );
}
