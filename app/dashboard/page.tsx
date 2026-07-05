import { AppShell } from "@/components/layout/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-text-primary">داشبورد</h1>
        <p className="text-text-secondary">
          پنل پشتیبانی و مدیریت — در فاز بعدی تکمیل می‌شود.
        </p>
      </div>
    </AppShell>
  );
}
