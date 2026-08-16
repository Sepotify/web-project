"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDashboardDate } from "@/lib/dashboard";
import {
  fetchSubscriptionPricing,
  updateSubscriptionPricing,
} from "@/lib/pricing";
import type { SubscriptionPricing, UserRole } from "@/types";

interface SubscriptionPricingPanelProps {
  role: UserRole;
  onUpdated?: (pricing: SubscriptionPricing) => void;
}

export function SubscriptionPricingPanel({
  role,
  onUpdated,
}: SubscriptionPricingPanelProps) {
  const [silverMonthly, setSilverMonthly] = useState("4.99");
  const [goldMonthly, setGoldMonthly] = useState("9.99");
  const [lastUpdated, setLastUpdated] = useState(new Date(0).toISOString());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const pricing = await fetchSubscriptionPricing();
      if (cancelled) return;
      setSilverMonthly(String(pricing.silverMonthly));
      setGoldMonthly(String(pricing.goldMonthly));
      setLastUpdated(pricing.updatedAt);
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const result = await updateSubscriptionPricing(
      {
        silverMonthly: Number(silverMonthly),
        goldMonthly: Number(goldMonthly),
      },
      role,
    );

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSilverMonthly(String(result.pricing.silverMonthly));
    setGoldMonthly(String(result.pricing.goldMonthly));
    setLastUpdated(result.pricing.updatedAt);
    onUpdated?.(result.pricing);
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-elevated p-5 sm:p-6">
        <p className="text-sm text-text-secondary">Loading subscription pricing...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-lg border border-border-default bg-bg-elevated p-5 sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="silver-price" className="mb-1.5 block text-sm font-medium text-text-primary">
            Silver monthly price (USD)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              $
            </span>
            <Input
              id="silver-price"
              type="number"
              min="0.01"
              step="0.01"
              value={silverMonthly}
              onChange={(event) => setSilverMonthly(event.target.value)}
              className="pl-7"
              required
            />
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">
            Playlist limits and standard streaming perks.
          </p>
        </div>

        <div>
          <label htmlFor="gold-price" className="mb-1.5 block text-sm font-medium text-text-primary">
            Gold monthly price (USD)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              $
            </span>
            <Input
              id="gold-price"
              type="number"
              min="0.01"
              step="0.01"
              value={goldMonthly}
              onChange={(event) => setGoldMonthly(event.target.value)}
              className="pl-7"
              required
            />
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">
            Early access releases and premium listening features.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-accent-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-border-default pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-secondary">
          Last updated: {formatDashboardDate(lastUpdated)}
        </p>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Updating..." : "Update pricing"}
        </Button>
      </div>
    </form>
  );
}
