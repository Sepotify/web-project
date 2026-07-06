"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { buildPieChartGradient } from "@/lib/analytics";
import type { SubscriptionDistributionSegment } from "@/lib/analytics";

interface SubscriptionPieChartProps {
  segments: SubscriptionDistributionSegment[];
}

export function SubscriptionPieChart({ segments }: SubscriptionPieChartProps) {
  const totalUsers = segments.reduce((sum, segment) => sum + segment.count, 0);
  const gradient = buildPieChartGradient(segments);

  if (totalUsers === 0 || !gradient) {
    return (
      <EmptyState
        title="No user data"
        description="Subscription distribution will appear once users are registered."
        icon="📊"
        className="rounded-lg border border-dashed border-border-default bg-bg-elevated py-10"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-lg border border-border-default bg-bg-elevated p-5 sm:flex-row sm:items-center sm:justify-center sm:gap-10 sm:p-6">
      <div className="relative h-44 w-44 shrink-0">
        <div
          className="h-full w-full rounded-full"
          style={{ background: gradient }}
          role="img"
          aria-label="Pie chart of users by subscription tier"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-bg-elevated text-center">
            <span className="text-lg font-bold text-text-primary">{totalUsers}</span>
            <span className="text-[10px] uppercase tracking-wide text-text-secondary">
              Users
            </span>
          </div>
        </div>
      </div>

      <ul className="w-full max-w-xs space-y-3">
        {segments.map((segment) => (
          <li key={segment.tier} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              <span className="text-text-primary">{segment.label}</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-text-primary">{segment.count}</span>
              <span className="ml-2 text-text-secondary">({segment.percentage}%)</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
