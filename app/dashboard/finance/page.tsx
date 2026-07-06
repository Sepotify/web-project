"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FinancialAuditTable } from "@/components/dashboard/FinancialAuditTable";
import { useToast } from "@/components/ui/Toast";
import {
  confirmArtistSettlement,
  getCurrentMonthKey,
  getMonthlySettlementAudit,
  isDashboardAdmin,
} from "@/lib/finance";
import { useAuth } from "@/store/AuthContext";

export default function DashboardFinancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [version, setVersion] = useState(0);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const monthKey = getCurrentMonthKey();

  useEffect(() => {
    if (user && user.role === "support") {
      router.replace("/dashboard/artists");
    }
  }, [router, user]);

  void version;

  if (!user || user.role === "support") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-secondary">Loading financial audit...</p>
      </div>
    );
  }

  const rows = getMonthlySettlementAudit(monthKey);
  const canConfirmSettlement = isDashboardAdmin(user.role);

  function handleConfirmSettlement(settlementId: string) {
    if (!user) return;

    setConfirmingId(settlementId);
    const confirmed = confirmArtistSettlement(settlementId, user.role);
    setConfirmingId(null);

    if (!confirmed) {
      showToast("Could not confirm settlement.", "error");
      return;
    }

    setVersion((value) => value + 1);
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
        onConfirmSettlement={handleConfirmSettlement}
        confirmingId={confirmingId}
      />
    </div>
  );
}
