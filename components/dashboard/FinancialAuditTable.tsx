"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMonthKey } from "@/lib/finance";
import type { SettlementAuditRow } from "@/lib/finance";

interface FinancialAuditTableProps {
  rows: SettlementAuditRow[];
  monthKey: string;
  canConfirmSettlement: boolean;
  onConfirmSettlement: (settlementId: string) => void;
  confirmingId?: string | null;
}

export function FinancialAuditTable({
  rows,
  monthKey,
  canConfirmSettlement,
  onConfirmSettlement,
  confirmingId,
}: FinancialAuditTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No settlement records"
        description="Approved artists with activity will appear in the monthly audit."
        icon="💰"
        className="rounded-lg border border-dashed border-border-default bg-bg-elevated py-10"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-secondary">
        Reporting period: <span className="font-medium text-text-primary">{formatMonthKey(monthKey)}</span>
      </p>

      <div className="overflow-x-auto rounded-lg border border-border-default">
        <table className="min-w-full divide-y divide-border-default text-sm">
          <thead className="bg-bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Artist</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Unique listeners
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Streams</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Payout</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
              {canConfirmSettlement && (
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-bg-elevated">
            {rows.map(({ settlement, artistName }) => (
              <tr key={settlement.id}>
                <td className="px-4 py-3 font-medium text-text-primary">{artistName}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {settlement.uniqueListeners.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {settlement.streams.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium text-accent-primary">
                  ${settlement.payoutAmount.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={settlement.status === "paid" ? "success" : "warning"}>
                    {settlement.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </td>
                {canConfirmSettlement && (
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={settlement.status === "paid" || confirmingId === settlement.id}
                      onClick={() => onConfirmSettlement(settlement.id)}
                    >
                      {settlement.status === "paid"
                        ? "Settled"
                        : confirmingId === settlement.id
                          ? "Confirming..."
                          : "Confirm settlement"}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
