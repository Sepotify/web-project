"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { ApiError } from "@/lib/api/client";
import { apiInitPayment } from "@/lib/api/endpoints";
import {
  PAYMENT_DURATIONS,
  calculatePaymentAmount,
  durationLabel,
  formatPaymentAmount,
  type PaidTier,
} from "@/lib/payments";
import { fetchSubscriptionPricing } from "@/lib/pricing";
import { SUBSCRIPTION_LABELS } from "@/lib/profile";
import { useAuth } from "@/store/AuthContext";
import type { SubscriptionPricing } from "@/types";
import { cn } from "@/lib/utils";

export default function PaymentPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [pricing, setPricing] = useState<SubscriptionPricing | null>(null);
  const [tier, setTier] = useState<PaidTier>("silver");
  const [months, setMonths] = useState<(typeof PAYMENT_DURATIONS)[number]>(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    let cancelled = false;
    void fetchSubscriptionPricing().then((value) => {
      if (!cancelled) setPricing(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.subscription === "gold") {
      setTier("gold");
    }
  }, [user?.subscription]);

  const monthly = useMemo(() => {
    if (!pricing) return 0;
    return tier === "gold" ? pricing.goldMonthly : pricing.silverMonthly;
  }, [pricing, tier]);

  const total = calculatePaymentAmount(monthly, months);

  async function handlePay() {
    setError("");
    setSubmitting(true);
    try {
      const session = await apiInitPayment({
        tier,
        duration_months: months,
      });
      window.location.href = session.payment_url;
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof ApiError ? err.message : "Could not start checkout.");
    }
  }

  if (isLoading || !user || !pricing) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            Upgrade subscription
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Pay with ZarinPal sandbox. Amount is monthly price × selected duration.
          </p>
        </div>

        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">Current plan</span>
            <Badge variant="info">{SUBSCRIPTION_LABELS[user.subscription]}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["silver", "gold"] as const).map((option) => {
              const price =
                option === "gold" ? pricing.goldMonthly : pricing.silverMonthly;
              const selected = tier === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTier(option)}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      "bg-bg-primary transition-colors",
                      selected && "border-accent-primary ring-1 ring-accent-primary",
                    )}
                  >
                    <h2 className="font-semibold text-text-primary">
                      {SUBSCRIPTION_LABELS[option]}
                    </h2>
                    <p className="mt-1 text-lg font-bold text-accent-primary">
                      {formatPaymentAmount(price)} / mo
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {option === "gold"
                        ? "Unlimited playlists + premium perks"
                        : "Up to 100 playlists"}
                    </p>
                  </Card>
                </button>
              );
            })}
          </div>

          <Select
            label="Duration"
            value={String(months)}
            onChange={(event) =>
              setMonths(Number(event.target.value) as (typeof PAYMENT_DURATIONS)[number])
            }
            options={PAYMENT_DURATIONS.map((value) => ({
              value: String(value),
              label: durationLabel(value),
            }))}
          />

          <div className="flex items-center justify-between rounded-md border border-border-default bg-bg-primary px-4 py-3">
            <span className="text-sm text-text-secondary">Amount due</span>
            <span className="text-lg font-bold text-text-primary">
              {formatPaymentAmount(total)}
            </span>
          </div>

          {error && <p className="text-sm text-accent-danger">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={handlePay} disabled={submitting}>
              {submitting ? "Redirecting..." : "Pay with ZarinPal"}
            </Button>
            <Link href="/settings" className="flex-1">
              <Button variant="secondary" className="w-full" type="button">
                Back to settings
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
