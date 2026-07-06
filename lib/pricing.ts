import { getSubscriptionPricing, setSubscriptionPricing } from "@/lib/storage";
import type { SubscriptionPricing, UserRole } from "@/types";

export function readSubscriptionPricing(): SubscriptionPricing {
  return getSubscriptionPricing();
}

export interface UpdatePricingInput {
  silverMonthly: number;
  goldMonthly: number;
}

export function updateSubscriptionPricing(
  input: UpdatePricingInput,
  role: UserRole | undefined,
):
  | { success: true; pricing: SubscriptionPricing }
  | { success: false; error: string } {
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

  const pricing: SubscriptionPricing = {
    silverMonthly: Math.round(silverMonthly * 100) / 100,
    goldMonthly: Math.round(goldMonthly * 100) / 100,
    updatedAt: new Date().toISOString(),
  };

  setSubscriptionPricing(pricing);
  return { success: true, pricing };
}
