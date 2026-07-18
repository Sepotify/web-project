import type { WorkStats } from "@/lib/catalog";

interface WorkStatsGridProps {
  stats: WorkStats;
}

export function WorkStatsGrid({ stats }: WorkStatsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded-md border border-border-default bg-bg-secondary p-3 text-sm">
      <div>
        <p className="text-xs text-text-muted">Listeners</p>
        <p className="font-medium text-text-primary">{stats.listeners.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs text-text-muted">Streams</p>
        <p className="font-medium text-text-primary">{stats.streams.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs text-text-muted">Revenue</p>
        <p className="font-medium text-accent-primary">${stats.earnings.toFixed(2)}</p>
      </div>
    </div>
  );
}
