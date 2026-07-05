import { AppShell } from "@/components/layout/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-text-primary">خوش آمدید</h1>
        <p className="text-text-secondary">
          پروژه Mock Spotify — فاز اول در حال توسعه است.
        </p>
      </div>
    </AppShell>
  );
}
