"use client";

import { useEffect, useState } from "react";
import { TicketsTable } from "@/components/dashboard/TicketsTable";
import { fetchTicketSummaries, type TicketSummary } from "@/lib/tickets";
import { useAuth } from "@/store/AuthContext";

export default function DashboardTicketsPage() {
  const { useApiAuth } = useAuth();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const data = await fetchTicketSummaries(useApiAuth);
      if (!cancelled) {
        setTickets(data);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [useApiAuth]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Support tickets</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review user requests and respond in the ticket conversation view.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading tickets...</p>
      ) : (
        <TicketsTable tickets={tickets} />
      )}
    </div>
  );
}
