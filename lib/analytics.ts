import { formatMonthKey, getCurrentMonthKey } from "@/lib/finance";
import { getSubscriptionPricing, getUsers } from "@/lib/storage";
import type { SubscriptionTier } from "@/types";

export interface SubscriptionDistributionSegment {
  tier: SubscriptionTier;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

const TIER_META: Record<SubscriptionTier, { label: string; color: string }> = {
  basic: { label: "Basic", color: "#71717a" },
  silver: { label: "Silver", color: "#60a5fa" },
  gold: { label: "Gold", color: "#fbbf24" },
};

const TIERS: SubscriptionTier[] = ["basic", "silver", "gold"];

export function getSubscriptionDistribution(): SubscriptionDistributionSegment[] {
  const users = getUsers();
  const counts: Record<SubscriptionTier, number> = {
    basic: 0,
    silver: 0,
    gold: 0,
  };

  for (const user of users) {
    counts[user.subscription] += 1;
  }

  const total = users.length;

  return TIERS.map((tier) => ({
    tier,
    label: TIER_META[tier].label,
    count: counts[tier],
    percentage: total === 0 ? 0 : Math.round((counts[tier] / total) * 1000) / 10,
    color: TIER_META[tier].color,
  }));
}

export interface CurrentMonthRevenueStats {
  monthKey: string;
  monthLabel: string;
  totalRevenue: number;
  silverRevenue: number;
  goldRevenue: number;
  silverSubscribers: number;
  goldSubscribers: number;
  payingSubscribers: number;
  silverPrice: number;
  goldPrice: number;
}

export function getCurrentMonthRevenueStats(
  date = new Date(),
): CurrentMonthRevenueStats {
  const monthKey = getCurrentMonthKey(date);
  const pricing = getSubscriptionPricing();
  const users = getUsers();

  let silverSubscribers = 0;
  let goldSubscribers = 0;

  for (const user of users) {
    if (user.subscription === "silver") silverSubscribers += 1;
    if (user.subscription === "gold") goldSubscribers += 1;
  }

  const silverRevenue = silverSubscribers * pricing.silverMonthly;
  const goldRevenue = goldSubscribers * pricing.goldMonthly;

  return {
    monthKey,
    monthLabel: formatMonthKey(monthKey),
    totalRevenue: silverRevenue + goldRevenue,
    silverRevenue,
    goldRevenue,
    silverSubscribers,
    goldSubscribers,
    payingSubscribers: silverSubscribers + goldSubscribers,
    silverPrice: pricing.silverMonthly,
    goldPrice: pricing.goldMonthly,
  };
}

export function buildPieChartGradient(
  segments: SubscriptionDistributionSegment[],
): string | null {
  const active = segments.filter((segment) => segment.count > 0);
  const total = active.reduce((sum, segment) => sum + segment.count, 0);

  if (total === 0) return null;

  let cumulative = 0;
  const stops = active.map((segment) => {
    const start = (cumulative / total) * 100;
    cumulative += segment.count;
    const end = (cumulative / total) * 100;
    return `${segment.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}
