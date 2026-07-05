import { AppShell } from "@/components/layout/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary">
          Support and admin panel — coming in a later phase.
        </p>
      </div>
    </AppShell>
  );
}
