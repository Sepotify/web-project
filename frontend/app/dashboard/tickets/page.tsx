"use client";

import { TicketsTable } from "@/components/dashboard/TicketsTable";
import { getTicketSummaries } from "@/lib/tickets";

export default function DashboardTicketsPage() {
  const tickets = getTicketSummaries();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Support tickets</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review user requests and respond in the ticket conversation view.
        </p>
      </div>

      <TicketsTable tickets={tickets} />
    </div>
  );
}
