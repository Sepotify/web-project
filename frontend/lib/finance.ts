import { ApiError } from "@/lib/api/client";
import {
  apiConfirmSettlement,
  apiFetchSettlements,
} from "@/lib/api/endpoints";
import { calculateArtistEarnings } from "@/lib/admin";
import {
  addArtistSettlement,
  getArtistById,
  getArtistSettlementById,
  getArtistSettlements,
  getArtists,
  updateArtistSettlement,
} from "@/lib/storage";
import { createId } from "@/lib/utils";
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
      id: createId(),
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

export async function fetchMonthlySettlementAudit(
  monthKey: string,
  useApi: boolean,
): Promise<SettlementAuditRow[]> {
  if (!useApi) {
    syncMonthlySettlements(monthKey);
    return getMonthlySettlementAudit(monthKey);
  }

  try {
    const data = await apiFetchSettlements(monthKey);
    return data.results.map((row) => ({
      settlement: {
        id: String(row.id),
        artistId: String(row.artist_id),
        monthKey: row.month_key,
        uniqueListeners: row.unique_listeners,
        streams: row.streams,
        payoutAmount: Number(row.payout_amount),
        status: row.status,
        createdAt: row.created_at,
        paidAt: row.paid_at ?? undefined,
      },
      artistName: row.artist_stage_name,
    }));
  } catch {
    syncMonthlySettlements(monthKey);
    return getMonthlySettlementAudit(monthKey);
  }
}

export async function confirmArtistSettlementRequest(
  settlementId: string,
  role: UserRole,
  useApi: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (role !== "admin") {
    return { success: false, error: "Only admins can confirm settlements." };
  }

  if (useApi) {
    try {
      await apiConfirmSettlement(settlementId);
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
    }
  }

  const confirmed = confirmArtistSettlement(settlementId, role);
  return confirmed
    ? { success: true }
    : { success: false, error: "Could not confirm settlement." };
}

export function isDashboardAdmin(role: UserRole | undefined): boolean {
  return role === "admin";
}
