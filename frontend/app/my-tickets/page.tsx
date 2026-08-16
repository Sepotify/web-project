"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDashboardDate } from "@/lib/dashboard";
import {
  fetchTicketSummaries,
  formatTicketId,
  getTicketStatusLabel,
  type TicketSummary,
} from "@/lib/tickets";
import { useAuth } from "@/store/AuthContext";
import type { TicketStatus } from "@/types";

function statusVariant(status: TicketStatus) {
  switch (status) {
    case "open":
      return "warning" as const;
    case "in_progress":
      return "info" as const;
    case "resolved":
      return "success" as const;
    default:
      return "default" as const;
  }
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, useApiAuth } = useAuth();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isLoading && user && user.role !== "listener" && user.role !== "artist") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    if (!user || (user.role !== "listener" && user.role !== "artist")) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await fetchTicketSummaries(useApiAuth);
      if (!cancelled) {
        setTickets(data);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, useApiAuth]);

  if (isLoading || !user || loading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading your tickets...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">My support tickets</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Track open requests and continue the conversation with support.
            </p>
          </div>
          <Link href="/settings">
            <Button size="sm" variant="secondary">
              Open a new ticket
            </Button>
          </Link>
        </div>

        {tickets.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            description="Open a support ticket from Settings when you need help."
            icon="🎫"
            className="rounded-lg border border-dashed border-border-default bg-bg-elevated py-10"
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-default">
            <table className="min-w-full divide-y divide-border-default text-sm">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Updated</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default bg-bg-elevated">
                {tickets.map(({ ticket }) => (
                  <tr key={ticket.id}>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                      {formatTicketId(ticket.id)}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{ticket.subject}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatDashboardDate(ticket.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(ticket.status)}>
                        {getTicketStatusLabel(ticket.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/my-tickets/${ticket.id}`}>
                        <Button size="sm" variant="secondary">
                          Open
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
