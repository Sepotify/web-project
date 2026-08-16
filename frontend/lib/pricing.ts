import { ApiError } from "@/lib/api/client";
import { apiFetchPricing, apiUpdatePricing } from "@/lib/api/endpoints";
import { getSubscriptionPricing, setSubscriptionPricing } from "@/lib/storage";
import type { SubscriptionPricing, UserRole } from "@/types";

export function readSubscriptionPricing(): SubscriptionPricing {
  return getSubscriptionPricing();
}

export interface UpdatePricingInput {
  silverMonthly: number;
  goldMonthly: number;
}

function mapApiPricing(data: {
  silver_monthly: string | number;
  gold_monthly: string | number;
  updated_at: string;
}): SubscriptionPricing {
  return {
    silverMonthly: Number(data.silver_monthly),
    goldMonthly: Number(data.gold_monthly),
    updatedAt: data.updated_at,
  };
}

export async function fetchSubscriptionPricing(): Promise<SubscriptionPricing> {
  try {
    const data = await apiFetchPricing();
    const pricing = mapApiPricing(data);
    setSubscriptionPricing(pricing);
    return pricing;
  } catch {
    return getSubscriptionPricing();
  }
}

export async function updateSubscriptionPricing(
  input: UpdatePricingInput,
  role: UserRole | undefined,
): Promise<
  | { success: true; pricing: SubscriptionPricing }
  | { success: false; error: string }
> {
  if (role !== "admin") {
    return { success: false, error: "Only admins can update subscription pricing." };
  }

  const silverMonthly = Number(input.silverMonthly);
  const goldMonthly = Number(input.goldMonthly);

  if (!Number.isFinite(silverMonthly) || silverMonthly <= 0) {
    return { success: false, error: "Silver price must be a positive number." };
  }

  if (!Number.isFinite(goldMonthly) || goldMonthly <= 0) {
    return { success: false, error: "Gold price must be a positive number." };
  }

  if (goldMonthly <= silverMonthly) {
    return { success: false, error: "Gold price must be higher than Silver." };
  }

  try {
    const data = await apiUpdatePricing({
      silver_monthly: Math.round(silverMonthly * 100) / 100,
      gold_monthly: Math.round(goldMonthly * 100) / 100,
    });
    const pricing = mapApiPricing(data);
    setSubscriptionPricing(pricing);
    return { success: true, pricing };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }

    // Offline fallback for demos without backend.
    const pricing: SubscriptionPricing = {
      silverMonthly: Math.round(silverMonthly * 100) / 100,
      goldMonthly: Math.round(goldMonthly * 100) / 100,
      updatedAt: new Date().toISOString(),
    };
    setSubscriptionPricing(pricing);
    return { success: true, pricing };
  }
}
