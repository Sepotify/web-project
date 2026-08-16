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
  fetchTicketSummary,
  getTicketStatusLabel,
  replyToTicketRequest,
  updateTicketStatusRequest,
  type TicketSummary,
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
  const { user, useApiAuth } = useAuth();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const data = await fetchTicketSummary(ticketId, useApiAuth);
      if (cancelled) return;
      if (!data) {
        router.replace("/dashboard/tickets");
        return;
      }
      setSummary(data);
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [ticketId, useApiAuth, router]);

  if (isLoading || !summary || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-secondary">Loading ticket...</p>
      </div>
    );
  }

  const { ticket, user: requester } = summary;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setIsSending(true);
    const result = await replyToTicketRequest(
      ticket.id,
      user.id,
      user.role,
      message,
      useApiAuth,
    );
    setIsSending(false);

    if (!result.success) {
      setError(result.error ?? "Could not send message.");
      return;
    }

    if (result.summary) setSummary(result.summary);
    setMessage("");
    setError(undefined);
    showToast("Reply sent.", "success");
  }

  async function handleStatusChange(nextStatus: TicketStatus) {
    const result = await updateTicketStatusRequest(ticket.id, nextStatus, useApiAuth);
    if (!result.success) {
      showToast(result.error ?? "Could not update ticket status.", "error");
      return;
    }

    if (result.summary) setSummary(result.summary);
    showToast("Ticket status updated.", "success");
  }

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
            {ticket.subject}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Ticket {formatTicketId(ticket.id)} · {requester.displayName}
          </p>
        </div>

        <Badge variant={ticket.status === "closed" ? "default" : "info"}>
          {getTicketStatusLabel(ticket.status)}
        </Badge>
      </div>

      <Card className="flex min-h-[420px] flex-col p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 border-b border-border-default pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm text-text-muted">
            Opened {formatDashboardDate(ticket.createdAt)}
          </div>
          <Select
            label="Ticket status"
            value={ticket.status}
            onChange={(event) => void handleStatusChange(event.target.value as TicketStatus)}
            options={STATUS_OPTIONS}
            className="sm:max-w-xs"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {ticket.messages.map((entry) => {
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

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mt-4 border-t border-border-default pt-4"
        >
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
          <Button type="submit" className="mt-3" disabled={isSending}>
            {isSending ? "Sending..." : "Send reply"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
