import {
  addNotification,
  getArtistById,
  getNotifications,
  getUserById,
  getUsers,
} from "@/lib/storage";
import type { Artist, Notification, NotificationType, Ticket } from "@/types";

type NotificationInput = Omit<Notification, "id" | "createdAt" | "isRead"> & {
  id?: string;
};

function createNotification(input: NotificationInput): Notification {
  const notification: Notification = {
    id: input.id ?? crypto.randomUUID(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  addNotification(notification);
  return notification;
}

function getStaffUserIds(): string[] {
  return getUsers()
    .filter((user) => user.role === "admin" || user.role === "support")
    .map((user) => user.id);
}

function hasRecentNotification(
  userId: string,
  type: NotificationType,
  match: (notification: Notification) => boolean,
  withinMs = 24 * 60 * 60 * 1000,
): boolean {
  const cutoff = Date.now() - withinMs;
  return getNotifications().some(
    (notification) =>
      notification.userId === userId &&
      notification.type === type &&
      new Date(notification.createdAt).getTime() >= cutoff &&
      match(notification),
  );
}

export function notifySubscriptionExpiring(
  userId: string,
  tier: string,
  daysRemaining: number,
): void {
  if (daysRemaining <= 0) return;

  const alreadyNotified = hasRecentNotification(
    userId,
    "subscription_expiring",
    (notification) => notification.message.includes(`${daysRemaining} day`),
  );
  if (alreadyNotified) return;

  const dayLabel = daysRemaining === 1 ? "day" : "days";

  createNotification({
    userId,
    type: "subscription_expiring",
    title: `Your ${tier} plan expires soon`,
    message: `Your subscription ends in ${daysRemaining} ${dayLabel}. Renew to keep your playlist limits and perks.`,
    link: "/settings",
  });
}

export function notifyFollowersOfNewRelease(
  artistId: string,
  release: {
    title: string;
    link: string;
    releaseLabel: string;
  },
): void {
  const artist = getArtistById(artistId);
  if (!artist) return;

  const followers = getUsers().filter(
    (user) =>
      user.role === "listener" && user.followingArtistIds.includes(artistId),
  );

  for (const follower of followers) {
    createNotification({
      userId: follower.id,
      type: "new_release",
      title: `${artist.stageName} released ${release.title}`,
      message: `A new ${release.releaseLabel} from ${artist.stageName} is available now.`,
      link: release.link,
    });
  }
}

export function notifyArtistApproval(userId: string, stageName: string): void {
  createNotification({
    userId,
    type: "artist_approval",
    title: "Your artist account was approved",
    message: `${stageName}, your artist account is approved. You can now upload music and manage your catalog.`,
    link: "/artist/works",
  });
}

export function notifyArtistRejection(
  userId: string,
  stageName: string,
  reason: string,
): void {
  createNotification({
    userId,
    type: "artist_rejection",
    title: "Your artist application was rejected",
    message: `${stageName}, your application was not approved. Reason: ${reason}`,
    link: "/register/pending",
  });
}

export function notifyArtistMonthlyEarnings(
  userId: string,
  summary: {
    monthLabel: string;
    earnings: number;
    streams: number;
    listeners: number;
  },
): void {
  const alreadyNotified = hasRecentNotification(
    userId,
    "monthly_earnings",
    (notification) => notification.title.includes(summary.monthLabel),
    28 * 24 * 60 * 60 * 1000,
  );
  if (alreadyNotified) return;

  createNotification({
    userId,
    type: "monthly_earnings",
    title: `${summary.monthLabel} earnings are ready`,
    message: `You earned $${summary.earnings.toFixed(2)} from ${summary.streams.toLocaleString()} streams and ${summary.listeners.toLocaleString()} unique listeners.`,
    link: "/artist/works",
  });
}

export function notifyStaffOfNewTicket(ticket: Ticket): void {
  const requester = getUserById(ticket.userId);
  const requesterName = requester?.displayName ?? "A user";

  for (const userId of getStaffUserIds()) {
    createNotification({
      userId,
      type: "new_ticket",
      title: "New support ticket opened",
      message: `${requesterName} opened ticket "${ticket.subject}".`,
      link: `/dashboard?tab=tickets&ticketId=${ticket.id}`,
    });
  }
}

export function notifyStaffOfArtistVerificationRequest(artist: Artist): void {
  for (const userId of getStaffUserIds()) {
    createNotification({
      userId,
      type: "artist_verification_request",
      title: `New artist application: ${artist.stageName}`,
      message: `${artist.stageName} submitted portfolio materials for review.`,
      link: `/dashboard?tab=artists&artistId=${artist.id}`,
    });
  }
}
