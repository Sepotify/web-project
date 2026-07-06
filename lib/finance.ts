import { calculateArtistEarnings } from "@/lib/admin";
import {
  addArtistSettlement,
  getArtistById,
  getArtistSettlementById,
  getArtistSettlements,
  getArtists,
  updateArtistSettlement,
} from "@/lib/storage";
import type { ArtistSettlement, UserRole } from "@/types";

export interface SettlementAuditRow {
  settlement: ArtistSettlement;
  artistName: string;
}

export function getCurrentMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en", { month: "long", year: "numeric" });
}

export function syncMonthlySettlements(monthKey = getCurrentMonthKey()): void {
  const approvedArtists = getArtists().filter((artist) => artist.status === "approved");
  const existing = getArtistSettlements().filter(
    (settlement) => settlement.monthKey === monthKey,
  );
  const existingArtistIds = new Set(existing.map((settlement) => settlement.artistId));

  for (const artist of approvedArtists) {
    if (existingArtistIds.has(artist.id)) continue;

    addArtistSettlement({
      id: crypto.randomUUID(),
      artistId: artist.id,
      monthKey,
      uniqueListeners: artist.totalListeners,
      streams: artist.totalStreams,
      payoutAmount: calculateArtistEarnings(artist.totalStreams),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }
}

export function getMonthlySettlementAudit(
  monthKey = getCurrentMonthKey(),
): SettlementAuditRow[] {
  return getArtistSettlements()
    .filter((settlement) => settlement.monthKey === monthKey)
    .map((settlement) => {
      const artist = getArtistById(settlement.artistId);
      return {
        settlement,
        artistName: artist?.stageName ?? "Unknown artist",
      };
    })
    .sort((a, b) => b.settlement.payoutAmount - a.settlement.payoutAmount);
}

export function confirmArtistSettlement(
  settlementId: string,
  role: UserRole,
): boolean {
  if (role !== "admin") return false;

  const settlement = getArtistSettlementById(settlementId);
  if (!settlement || settlement.status === "paid") return false;

  updateArtistSettlement(settlementId, {
    status: "paid",
    paidAt: new Date().toISOString(),
  });

  return true;
}

export function isDashboardAdmin(role: UserRole | undefined): boolean {
  return role === "admin";
}
