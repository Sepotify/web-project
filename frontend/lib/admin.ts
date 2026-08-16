import { getArtistById, updateArtist, addTicket, getUserById } from "@/lib/storage";
import type { Ticket, TicketMessage } from "@/types";
import {
  notifyArtistApproval,
  notifyArtistRejection,
  notifyArtistMonthlyEarnings,
  notifyStaffOfNewTicket,
} from "@/lib/notification-events";
import { createId } from "@/lib/utils";

const EARNINGS_PER_STREAM = 0.002;

export function approveArtist(artistId: string): boolean {
  const artist = getArtistById(artistId);
  if (!artist || artist.status !== "pending") return false;

  updateArtist(artistId, { status: "approved", rejectionReason: undefined });
  notifyArtistApproval(artist.userId, artist.stageName);
  return true;
}

export function rejectArtist(artistId: string, reason: string): boolean {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return false;

  const artist = getArtistById(artistId);
  if (!artist || artist.status !== "pending") return false;

  updateArtist(artistId, {
    status: "rejected",
    rejectionReason: trimmedReason,
  });
  notifyArtistRejection(artist.userId, artist.stageName, trimmedReason);
  return true;
}

export function createSupportTicket(
  userId: string,
  subject: string,
  content: string,
): { success: boolean; ticket?: Ticket; error?: string } {
  const trimmedSubject = subject.trim();
  const trimmedContent = content.trim();

  if (!trimmedSubject) {
    return { success: false, error: "Subject is required." };
  }

  if (!trimmedContent) {
    return { success: false, error: "Message is required." };
  }

  const user = getUserById(userId);
  if (!user) {
    return { success: false, error: "User not found." };
  }

  const now = new Date().toISOString();
  const message: TicketMessage = {
    id: createId(),
    senderId: userId,
    senderRole: user.role,
    content: trimmedContent,
    createdAt: now,
  };

  const ticket: Ticket = {
    id: createId(),
    userId,
    subject: trimmedSubject,
    status: "open",
    messages: [message],
    createdAt: now,
    updatedAt: now,
  };

  addTicket(ticket);
  notifyStaffOfNewTicket(ticket);

  return { success: true, ticket };
}

export function calculateArtistEarnings(streams: number): number {
  return streams * EARNINGS_PER_STREAM;
}

export function generateArtistMonthlyEarningsNotification(artistId: string): boolean {
  const artist = getArtistById(artistId);
  if (!artist || artist.status !== "approved") return false;

  const monthLabel = new Date().toLocaleString("en", {
    month: "long",
    year: "numeric",
  });

  notifyArtistMonthlyEarnings(artist.userId, {
    monthLabel,
    earnings: calculateArtistEarnings(artist.totalStreams),
    streams: artist.totalStreams,
    listeners: artist.totalListeners,
  });

  return true;
}
