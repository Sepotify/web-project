"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDashboardDate } from "@/lib/dashboard";
import {
  formatTicketId,
  getTicketStatusLabel,
  type TicketSummary,
} from "@/lib/tickets";
import type { TicketStatus } from "@/types";

interface TicketsTableProps {
  tickets: TicketSummary[];
}

function getStatusVariant(status: TicketStatus) {
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

export function TicketsTable({ tickets }: TicketsTableProps) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No support tickets"
        description="User support requests will appear here when they are created."
        icon="🎫"
        className="rounded-lg border border-dashed border-border-default bg-bg-elevated py-10"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-default">
      <table className="min-w-full divide-y divide-border-default text-sm">
        <thead className="bg-bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">ID</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">User</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Subject</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Date</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default bg-bg-elevated">
          {tickets.map(({ ticket, user }) => (
            <tr key={ticket.id}>
              <td className="px-4 py-3 font-mono text-xs text-text-muted">
                {formatTicketId(ticket.id)}
              </td>
              <td className="px-4 py-3 text-text-primary">{user.displayName}</td>
              <td className="px-4 py-3 text-text-secondary">{ticket.subject}</td>
              <td className="px-4 py-3 text-text-muted">
                {formatDashboardDate(ticket.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={getStatusVariant(ticket.status)}>
                  {getTicketStatusLabel(ticket.status)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/dashboard/tickets/${ticket.id}`}>
                  <Button size="sm" variant="secondary">
                    Open chat
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
