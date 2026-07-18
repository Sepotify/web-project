"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SUBSCRIPTION_LABELS } from "@/lib/profile";
import { getSubscriptionPricing } from "@/lib/storage";
import { useAuth } from "@/store/AuthContext";

export default function PaymentPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </AppShell>
    );
  }

  const pricing = getSubscriptionPricing();

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            Upgrade subscription
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Payment integration will be available in Phase 2.
          </p>
        </div>

        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">Current plan</span>
            <Badge variant="info">{SUBSCRIPTION_LABELS[user.subscription]}</Badge>
          </div>

          <p className="text-sm leading-6 text-text-secondary">
            This is a placeholder checkout page. In Phase 2, you will be able to
            upgrade to Silver or Gold plans through a payment gateway.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card className="bg-bg-primary">
              <h2 className="font-semibold text-text-primary">Silver</h2>
              <p className="mt-1 text-lg font-bold text-accent-primary">
                ${pricing.silverMonthly.toFixed(2)}/mo
              </p>
              <p className="mt-1 text-sm text-text-muted">Up to 100 playlists</p>
            </Card>
            <Card className="bg-bg-primary">
              <h2 className="font-semibold text-text-primary">Gold</h2>
              <p className="mt-1 text-lg font-bold text-accent-primary">
                ${pricing.goldMonthly.toFixed(2)}/mo
              </p>
              <p className="mt-1 text-sm text-text-muted">Unlimited playlists + premium perks</p>
            </Card>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled className="flex-1">
              Proceed to payment (Phase 2)
            </Button>
            <Link href="/settings" className="flex-1">
              <Button variant="secondary" className="w-full">
                Back to settings
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
