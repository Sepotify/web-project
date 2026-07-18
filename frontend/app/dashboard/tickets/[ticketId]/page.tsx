"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { formatDashboardDate } from "@/lib/dashboard";
import {
  formatTicketId,
  getTicketStatusLabel,
  getTicketSummary,
  replyToTicket,
  updateTicketStatus,
} from "@/lib/tickets";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";
import type { TicketStatus, UserRole } from "@/types";

interface TicketChatPageProps {
  params: Promise<{ ticketId: string }>;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function isStaffRole(role: UserRole): boolean {
  return role === "support" || role === "admin";
}

export default function TicketChatPage({ params }: TicketChatPageProps) {
  const { ticketId } = use(params);
  return <TicketChatContent ticketId={ticketId} />;
}

function TicketChatContent({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();

  void version;
  const summary = getTicketSummary(ticketId);

  useEffect(() => {
    if (!summary) {
      router.replace("/dashboard/tickets");
    }
  }, [summary, router]);

  if (!summary || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-secondary">Loading ticket...</p>
      </div>
    );
  }

  const { ticket, user: requester } = summary;

  function refreshTicket() {
    setVersion((value) => value + 1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const result = replyToTicket(ticket.id, user.id, user.role, message);
    if (!result.success) {
      setError(result.error ?? "Could not send message.");
      return;
    }

    setMessage("");
    setError(undefined);
    refreshTicket();
    showToast("Reply sent.", "success");
  }

  function handleStatusChange(nextStatus: TicketStatus) {
    const updated = updateTicketStatus(ticket.id, nextStatus);
    if (!updated) {
      showToast("Could not update ticket status.", "error");
      return;
    }

    refreshTicket();
    showToast("Ticket status updated.", "success");
  }

  const currentTicket = getTicketSummary(ticketId)!.ticket;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/tickets"
            className="text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            ← Back to tickets
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
            {currentTicket.subject}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Ticket {formatTicketId(currentTicket.id)} · {requester.displayName}
          </p>
        </div>

        <Badge variant={currentTicket.status === "closed" ? "default" : "info"}>
          {getTicketStatusLabel(currentTicket.status)}
        </Badge>
      </div>

      <Card className="flex min-h-[420px] flex-col p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 border-b border-border-default pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm text-text-muted">
            Opened {formatDashboardDate(currentTicket.createdAt)}
          </div>
          <Select
            label="Ticket status"
            value={currentTicket.status}
            onChange={(event) => handleStatusChange(event.target.value as TicketStatus)}
            options={STATUS_OPTIONS}
            className="sm:max-w-xs"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {currentTicket.messages.map((entry) => {
            const isStaff = isStaffRole(entry.senderRole);
            const isMine = entry.senderId === user.id;

            return (
              <div
                key={entry.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    isStaff
                      ? "bg-accent-primary/15 text-text-primary"
                      : "bg-bg-secondary text-text-primary",
                  )}
                >
                  <p className="mb-1 text-xs font-medium text-text-muted">
                    {isStaff ? "Staff" : requester.displayName} ·{" "}
                    {formatDashboardDate(entry.createdAt)}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{entry.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 border-t border-border-default pt-4">
          <Textarea
            label="Your reply"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              if (error) setError(undefined);
            }}
            placeholder="Write a response to the user..."
            error={error}
          />
          <Button type="submit" className="mt-3">
            Send reply
          </Button>
        </form>
      </Card>
    </div>
  );
}
