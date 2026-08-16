import { ApiError } from "@/lib/api/client";
import {
  apiFetchRevenueStats,
  apiFetchSubscriptionDistribution,
} from "@/lib/api/endpoints";
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

export async function fetchSubscriptionDistribution(
  useApi: boolean,
): Promise<SubscriptionDistributionSegment[]> {
  if (!useApi) return getSubscriptionDistribution();

  try {
    const data = await apiFetchSubscriptionDistribution();
    return data.results.map((segment) => ({
      tier: segment.tier,
      label: segment.label,
      count: segment.count,
      percentage: segment.percentage,
      color: segment.color,
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      return getSubscriptionDistribution();
    }
    return getSubscriptionDistribution();
  }
}

export async function fetchCurrentMonthRevenueStats(
  useApi: boolean,
): Promise<CurrentMonthRevenueStats> {
  if (!useApi) return getCurrentMonthRevenueStats();

  try {
    const data = await apiFetchRevenueStats();
    return {
      monthKey: data.month_key,
      monthLabel: data.month_label,
      totalRevenue: data.total_revenue,
      silverRevenue: data.silver_revenue,
      goldRevenue: data.gold_revenue,
      silverSubscribers: data.silver_subscribers,
      goldSubscribers: data.gold_subscribers,
      payingSubscribers: data.paying_subscribers,
      silverPrice: data.silver_price,
      goldPrice: data.gold_price,
    };
  } catch {
    return getCurrentMonthRevenueStats();
  }
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
