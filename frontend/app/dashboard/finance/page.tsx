"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FinancialAuditTable } from "@/components/dashboard/FinancialAuditTable";
import { useToast } from "@/components/ui/Toast";
import {
  confirmArtistSettlementRequest,
  fetchMonthlySettlementAudit,
  getCurrentMonthKey,
  isDashboardAdmin,
  type SettlementAuditRow,
} from "@/lib/finance";
import { useAuth } from "@/store/AuthContext";

export default function DashboardFinancePage() {
  const router = useRouter();
  const { user, useApiAuth } = useAuth();
  const { showToast } = useToast();
  const [rows, setRows] = useState<SettlementAuditRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const monthKey = getCurrentMonthKey();

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
      const nextRows = await fetchMonthlySettlementAudit(monthKey, useApiAuth);
      if (!cancelled) {
        setRows(nextRows);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, useApiAuth, monthKey, refreshKey]);

  if (!user || user.role === "support" || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-secondary">Loading financial audit...</p>
      </div>
    );
  }

  const canConfirmSettlement = isDashboardAdmin(user.role);

  async function handleConfirmSettlement(settlementId: string) {
    if (!user) return;

    setConfirmingId(settlementId);
    const result = await confirmArtistSettlementRequest(
      settlementId,
      user.role,
      useApiAuth,
    );
    setConfirmingId(null);

    if (!result.success) {
      showToast(result.error ?? "Could not confirm settlement.", "error");
      return;
    }

    setRefreshKey((value) => value + 1);
    showToast("Settlement confirmed.", "success");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Financial audit</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review monthly artist payouts and confirm settlements when payments are complete.
        </p>
      </div>

      <FinancialAuditTable
        rows={rows}
        monthKey={monthKey}
        canConfirmSettlement={canConfirmSettlement}
        onConfirmSettlement={(id) => void handleConfirmSettlement(id)}
        confirmingId={confirmingId}
      />
    </div>
  );
}
