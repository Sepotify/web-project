"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RejectArtistModal } from "@/components/dashboard/RejectArtistModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { approveArtist, rejectArtist } from "@/lib/admin";
import { formatDashboardDate, getArtistApplication } from "@/lib/dashboard";

interface ArtistApplicationPageProps {
  params: Promise<{ artistId: string }>;
}

export default function ArtistApplicationPage({ params }: ArtistApplicationPageProps) {
  const { artistId } = use(params);
  return <ArtistApplicationContent artistId={artistId} />;
}

function ArtistApplicationContent({ artistId }: { artistId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const application = getArtistApplication(artistId);

  useEffect(() => {
    if (!application) {
      router.replace("/dashboard/artists");
    }
  }, [application, router]);

  if (!application) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-secondary">Loading application...</p>
      </div>
    );
  }

  const { artist, user } = application;
  const isPending = artist.status === "pending";

  function handleApprove() {
    setIsSubmitting(true);
    const approved = approveArtist(artist.id);
    setIsSubmitting(false);

    if (!approved) {
      showToast("Could not approve this application.", "error");
      return;
    }

    showToast(`${artist.stageName} was approved.`, "success");
    router.push("/dashboard/artists");
  }

  function handleReject(reason: string) {
    setIsSubmitting(true);
    const rejected = rejectArtist(artist.id, reason);
    setIsSubmitting(false);

    if (!rejected) {
      showToast("Could not reject this application.", "error");
      return;
    }

    setIsRejectOpen(false);
    showToast(`${artist.stageName} was rejected.`, "success");
    router.push("/dashboard/artists");
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/artists"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              ← Back to artist approvals
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              {artist.stageName}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">Artist application review</p>
          </div>

          <Badge
            variant={
              artist.status === "approved"
                ? "success"
                : artist.status === "rejected"
                  ? "danger"
                  : "warning"
            }
          >
            {artist.status}
          </Badge>
        </div>

        <Card className="p-5 sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">Email</dt>
              <dd className="mt-1 text-sm text-text-primary">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">Submitted</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {formatDashboardDate(artist.createdAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <h2 className="text-sm font-semibold text-text-primary">Portfolio sample</h2>
            {artist.portfolioUrl ? (
              <div className="mt-2 rounded-md border border-border-default bg-bg-secondary p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                  {artist.portfolioUrl}
                </p>
                {artist.portfolioUrl.startsWith("http") && (
                  <a
                    href={artist.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-accent-primary hover:underline"
                  >
                    Open portfolio link
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-text-muted">No portfolio sample was provided.</p>
            )}
          </div>

          {artist.status === "rejected" && artist.rejectionReason && (
            <div className="mt-5 rounded-md border border-accent-danger/30 bg-accent-danger/10 p-4">
              <h2 className="text-sm font-semibold text-accent-danger">Rejection reason</h2>
              <p className="mt-1 text-sm text-text-secondary">{artist.rejectionReason}</p>
            </div>
          )}

          {isPending && (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleApprove} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Approve"}
              </Button>
              <Button
                variant="danger"
                onClick={() => setIsRejectOpen(true)}
                disabled={isSubmitting}
              >
                Reject
              </Button>
            </div>
          )}
        </Card>
      </div>

      <RejectArtistModal
        isOpen={isRejectOpen}
        artistName={artist.stageName}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
