"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { formatDashboardDate } from "@/lib/dashboard";
import {
  fetchTicketSummary,
  formatTicketId,
  getTicketStatusLabel,
  replyToTicketRequest,
  type TicketSummary,
} from "@/lib/tickets";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface PageProps {
  params: Promise<{ ticketId: string }>;
}

function isStaffRole(role: UserRole): boolean {
  return role === "support" || role === "admin";
}

export default function MyTicketDetailPage({ params }: PageProps) {
  const { ticketId } = use(params);
  const router = useRouter();
  const { user, isAuthenticated, isLoading, useApiAuth } = useAuth();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const [isSending, setIsSending] = useState(false);

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

    const currentUserId = user.id;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await fetchTicketSummary(ticketId, useApiAuth);
      if (cancelled) return;
      if (!data || data.ticket.userId !== currentUserId) {
        router.replace("/my-tickets");
        return;
      }
      setSummary(data);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [ticketId, useApiAuth, user, router]);

  if (isLoading || !user || loading || !summary) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading ticket...</p>
        </div>
      </AppShell>
    );
  }

  const { ticket } = summary;
  const currentUser = user;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    const result = await replyToTicketRequest(
      ticket.id,
      currentUser.id,
      currentUser.role,
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

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div>
          <Link
            href="/my-tickets"
            className="text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            ← Back to my tickets
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
              {ticket.subject}
            </h1>
            <Badge variant={ticket.status === "closed" ? "default" : "info"}>
              {getTicketStatusLabel(ticket.status)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Ticket {formatTicketId(ticket.id)} · Opened{" "}
            {formatDashboardDate(ticket.createdAt)}
          </p>
        </div>

        <Card className="flex min-h-[420px] flex-col p-4 sm:p-5">
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {ticket.messages.map((entry) => {
              const isStaff = isStaffRole(entry.senderRole);
              const isMine = entry.senderId === currentUser.id;

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
                      {isStaff ? "Support" : "You"} ·{" "}
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
              label="Your message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                if (error) setError(undefined);
              }}
              placeholder="Add more details for support..."
              error={error}
            />
            <Button type="submit" className="mt-3" disabled={isSending}>
              {isSending ? "Sending..." : "Send message"}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
