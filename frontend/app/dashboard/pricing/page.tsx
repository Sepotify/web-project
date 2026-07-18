"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionPricingPanel } from "@/components/dashboard/SubscriptionPricingPanel";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/store/AuthContext";

export default function DashboardPricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user && user.role === "support") {
      router.replace("/dashboard/artists");
    }
  }, [router, user]);

  if (!user || user.role === "support") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-secondary">Loading subscription pricing...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Subscription pricing
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Set monthly prices for Silver and Gold plans. Changes apply to revenue projections
          immediately.
        </p>
      </div>

      <SubscriptionPricingPanel
        role={user.role}
        onUpdated={() => {
          showToast("Subscription pricing updated.", "success");
        }}
      />
    </div>
  );
}
