import { AppShell } from "@/components/layout/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Welcome</h1>
        <p className="text-text-secondary">
          Mock Spotify project — Phase 1 is in development.
        </p>
      </div>
    </AppShell>
  );
}
