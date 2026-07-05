"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTION_LABELS } from "@/lib/profile";
import type { SubscriptionTier } from "@/types";

interface SubscriptionSettingsProps {
  tier: SubscriptionTier;
}

function getSubscriptionBadgeVariant(tier: SubscriptionTier) {
  switch (tier) {
    case "gold":
      return "warning" as const;
    case "silver":
      return "info" as const;
    default:
      return "default" as const;
  }
}

export function SubscriptionSettings({ tier }: SubscriptionSettingsProps) {
  const isMaxTier = tier === "gold";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary">Current plan</span>
          <Badge variant={getSubscriptionBadgeVariant(tier)}>
            {SUBSCRIPTION_LABELS[tier]}
          </Badge>
        </div>
        <p className="text-sm text-text-muted">
          {tier === "basic" &&
            "Upgrade to unlock more playlists, profile photo changes, and premium features."}
          {tier === "silver" &&
            "You have expanded playlist limits and profile customization."}
          {tier === "gold" &&
            "You have full access to all premium features."}
        </p>
      </div>

      {!isMaxTier && (
        <Link href="/payment" className="w-full sm:w-auto">
          <Button className="w-full sm:min-w-[140px]">Upgrade plan</Button>
        </Link>
      )}
    </div>
  );
}
