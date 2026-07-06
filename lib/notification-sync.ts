import { getArtists, getSubscriptions, getUserById } from "@/lib/storage";
import { notifySubscriptionExpiring } from "@/lib/notification-events";
import { generateArtistMonthlyEarningsNotification } from "@/lib/admin";

const EXPIRY_WARNING_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function checkSubscriptionExpiryNotifications(): void {
  const now = Date.now();

  for (const subscription of getSubscriptions()) {
    if (!subscription.isActive || !subscription.endDate) continue;

    const user = getUserById(subscription.userId);
    if (!user || user.role !== "listener") continue;

    const endTime = new Date(subscription.endDate).getTime();
    const daysRemaining = Math.ceil((endTime - now) / MS_PER_DAY);

    if (daysRemaining > 0 && daysRemaining <= EXPIRY_WARNING_DAYS) {
      notifySubscriptionExpiring(user.id, subscription.tier, daysRemaining);
    }
  }
}

export function checkArtistMonthlyEarningsNotifications(): void {
  for (const artist of getArtists()) {
    if (artist.status !== "approved" || artist.totalStreams === 0) continue;
    generateArtistMonthlyEarningsNotification(artist.id);
  }
}

export function runNotificationChecks(): void {
  checkSubscriptionExpiryNotifications();
  checkArtistMonthlyEarningsNotifications();
}
