import {
  getTicketById,
  getTickets,
  getUserById,
  updateTicket,
} from "@/lib/storage";
import type { Ticket, TicketMessage, TicketStatus, User, UserRole } from "@/types";

export interface TicketSummary {
  ticket: Ticket;
  user: User;
}

const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function getTicketStatusLabel(status: TicketStatus): string {
  return TICKET_STATUS_LABELS[status];
}

export function formatTicketId(ticketId: string): string {
  return ticketId.slice(0, 8).toUpperCase();
}

export function getTicketSummaries(): TicketSummary[] {
  return getTickets()
    .map((ticket) => {
      const user = getUserById(ticket.userId);
      if (!user) return null;
      return { ticket, user };
    })
    .filter((entry): entry is TicketSummary => Boolean(entry))
    .sort(
      (a, b) =>
        new Date(b.ticket.updatedAt).getTime() - new Date(a.ticket.updatedAt).getTime(),
    );
}

export function getTicketSummary(ticketId: string): TicketSummary | null {
  const ticket = getTicketById(ticketId);
  if (!ticket) return null;

  const user = getUserById(ticket.userId);
  if (!user) return null;

  return { ticket, user };
}

export function replyToTicket(
  ticketId: string,
  senderId: string,
  senderRole: UserRole,
  content: string,
): { success: boolean; error?: string } {
  const ticket = getTicketById(ticketId);
  if (!ticket) {
    return { success: false, error: "Ticket not found." };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: "Message is required." };
  }

  const message: TicketMessage = {
    id: crypto.randomUUID(),
    senderId,
    senderRole,
    content: trimmed,
    createdAt: new Date().toISOString(),
  };

  const nextStatus: TicketStatus =
    ticket.status === "open" || ticket.status === "in_progress"
      ? "in_progress"
      : ticket.status;

  updateTicket(ticketId, {
    messages: [...ticket.messages, message],
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
}

export function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
): boolean {
  const ticket = getTicketById(ticketId);
  if (!ticket) return false;

  updateTicket(ticketId, {
    status,
    updatedAt: new Date().toISOString(),
  });

  return true;
}
