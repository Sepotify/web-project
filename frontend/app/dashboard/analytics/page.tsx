"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RevenueStatCards } from "@/components/dashboard/RevenueStatCards";
import { SubscriptionPieChart } from "@/components/dashboard/SubscriptionPieChart";
import {
  fetchCurrentMonthRevenueStats,
  fetchSubscriptionDistribution,
  type CurrentMonthRevenueStats,
  type SubscriptionDistributionSegment,
} from "@/lib/analytics";
import { useAuth } from "@/store/AuthContext";

export default function DashboardAnalyticsPage() {
  const router = useRouter();
  const { user, useApiAuth } = useAuth();
  const [distribution, setDistribution] = useState<SubscriptionDistributionSegment[]>([]);
  const [revenueStats, setRevenueStats] = useState<CurrentMonthRevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === "support") {
      router.replace("/dashboard/artists");
    }
  }, [router, user]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const [nextDistribution, nextRevenue] = await Promise.all([
        fetchSubscriptionDistribution(useApiAuth),
        fetchCurrentMonthRevenueStats(useApiAuth),
      ]);
      if (!cancelled) {
        setDistribution(nextDistribution);
        setRevenueStats(nextRevenue);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, useApiAuth]);

  if (!user || user.role === "support" || isLoading || !revenueStats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-secondary">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Subscription distribution and projected monthly revenue from active plans.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Current month revenue</h2>
        <RevenueStatCards stats={revenueStats} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">
          Users by subscription tier
        </h2>
        <SubscriptionPieChart segments={distribution} />
      </section>
    </div>
  );
}
