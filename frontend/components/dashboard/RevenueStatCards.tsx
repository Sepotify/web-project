"use client";

import type { CurrentMonthRevenueStats } from "@/lib/analytics";

interface RevenueStatCardsProps {
  stats: CurrentMonthRevenueStats;
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function RevenueStatCards({ stats }: RevenueStatCardsProps) {
  const cards = [
    {
      label: "Total subscription revenue",
      value: formatUsd(stats.totalRevenue),
      detail: `${stats.monthLabel} · projected MRR`,
    },
    {
      label: "Silver revenue",
      value: formatUsd(stats.silverRevenue),
      detail: `${stats.silverSubscribers} subscribers × ${formatUsd(stats.silverPrice)}`,
    },
    {
      label: "Gold revenue",
      value: formatUsd(stats.goldRevenue),
      detail: `${stats.goldSubscribers} subscribers × ${formatUsd(stats.goldPrice)}`,
    },
    {
      label: "Paying subscribers",
      value: String(stats.payingSubscribers),
      detail: "Silver and Gold combined",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-lg border border-border-default bg-bg-elevated p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{card.value}</p>
          <p className="mt-1 text-xs text-text-secondary">{card.detail}</p>
        </article>
      ))}
    </div>
  );
}
