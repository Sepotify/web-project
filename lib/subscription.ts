import type { SubscriptionTier } from "@/types";

export function canViewGoldStats(subscription: SubscriptionTier | undefined): boolean {
  return subscription === "gold";
}
