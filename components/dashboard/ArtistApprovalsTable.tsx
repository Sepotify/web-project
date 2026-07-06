"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDashboardDate, type ArtistApplication } from "@/lib/dashboard";

interface ArtistApprovalsTableProps {
  applications: ArtistApplication[];
}

export function ArtistApprovalsTable({ applications }: ArtistApprovalsTableProps) {
  if (applications.length === 0) {
    return (
      <EmptyState
        title="No pending artist applications"
        description="New artist sign-ups waiting for review will appear here."
        icon="🎤"
        className="rounded-lg border border-dashed border-border-default bg-bg-elevated py-10"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-default">
      <table className="min-w-full divide-y divide-border-default text-sm">
        <thead className="bg-bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Stage name</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Email</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Submitted</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default bg-bg-elevated">
          {applications.map(({ artist, user }) => (
            <tr key={artist.id}>
              <td className="px-4 py-3 font-medium text-text-primary">{artist.stageName}</td>
              <td className="px-4 py-3 text-text-secondary">{user.email}</td>
              <td className="px-4 py-3 text-text-muted">
                {formatDashboardDate(artist.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/dashboard/artists/${artist.id}`}>
                  <Button size="sm" variant="secondary">
                    View portfolio
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
