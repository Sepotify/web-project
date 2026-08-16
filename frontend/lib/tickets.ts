import { ApiError } from "@/lib/api/client";
import {
  apiCreateTicket,
  apiFetchTicket,
  apiFetchTickets,
  apiReplyToTicket,
  apiUpdateTicketStatus,
  type ApiTicketDetail,
  type ApiTicketListItem,
} from "@/lib/api/endpoints";
import {
  createSupportTicket as createLocalSupportTicket,
} from "@/lib/admin";
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

function stubUser(input: {
  id: string;
  displayName: string;
  email: string;
}): User {
  return {
    id: input.id,
    email: input.email,
    password: "",
    displayName: input.displayName,
    username: input.email.split("@")[0] || "user",
    role: "listener",
    subscription: "basic",
    followerIds: [],
    followingUserIds: [],
    followingArtistIds: [],
    dailyStreamCount: 0,
    createdAt: new Date().toISOString(),
  };
}

function mapApiMessages(detail: ApiTicketDetail): TicketMessage[] {
  return (detail.messages ?? []).map((message) => ({
    id: String(message.id),
    senderId: String(message.sender_id),
    senderRole: message.sender_role,
    content: message.content,
    createdAt: message.created_at,
  }));
}

function mapApiTicketListItem(item: ApiTicketListItem): TicketSummary {
  return {
    ticket: {
      id: String(item.id),
      userId: String(item.user_id),
      subject: item.subject,
      status: item.status,
      messages: [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    },
    user: stubUser({
      id: String(item.user_id),
      displayName: item.user_display_name,
      email: item.user_email,
    }),
  };
}

function mapApiTicketDetail(detail: ApiTicketDetail): TicketSummary {
  const base = mapApiTicketListItem(detail);
  return {
    ...base,
    ticket: {
      ...base.ticket,
      messages: mapApiMessages(detail),
    },
  };
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

export async function fetchTicketSummaries(useApi: boolean): Promise<TicketSummary[]> {
  if (!useApi) return getTicketSummaries();

  try {
    const data = await apiFetchTickets();
    return data.results.map(mapApiTicketListItem);
  } catch {
    return getTicketSummaries();
  }
}

export async function fetchTicketSummary(
  ticketId: string,
  useApi: boolean,
): Promise<TicketSummary | null> {
  if (!useApi) return getTicketSummary(ticketId);

  try {
    const data = await apiFetchTicket(ticketId);
    return mapApiTicketDetail(data);
  } catch {
    return getTicketSummary(ticketId);
  }
}

export async function createSupportTicketRequest(
  userId: string,
  subject: string,
  message: string,
  useApi: boolean,
): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
  if (useApi) {
    try {
      const data = await apiCreateTicket({
        subject: subject.trim(),
        message: message.trim(),
      });
      return { success: true, ticket: mapApiTicketDetail(data).ticket };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
    }
  }

  return createLocalSupportTicket(userId, subject, message);
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

export async function replyToTicketRequest(
  ticketId: string,
  senderId: string,
  senderRole: UserRole,
  content: string,
  useApi: boolean,
): Promise<{ success: boolean; summary?: TicketSummary; error?: string }> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: "Message is required." };
  }

  if (useApi) {
    try {
      const data = await apiReplyToTicket(ticketId, trimmed);
      return { success: true, summary: mapApiTicketDetail(data) };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
    }
  }

  const result = replyToTicket(ticketId, senderId, senderRole, trimmed);
  if (!result.success) return result;
  return { success: true, summary: getTicketSummary(ticketId) ?? undefined };
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

export async function updateTicketStatusRequest(
  ticketId: string,
  status: TicketStatus,
  useApi: boolean,
): Promise<{ success: boolean; summary?: TicketSummary; error?: string }> {
  if (useApi) {
    try {
      const data = await apiUpdateTicketStatus(ticketId, status);
      return { success: true, summary: mapApiTicketDetail(data) };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
    }
  }

  const updated = updateTicketStatus(ticketId, status);
  if (!updated) return { success: false, error: "Ticket not found." };
  return { success: true, summary: getTicketSummary(ticketId) ?? undefined };
}
