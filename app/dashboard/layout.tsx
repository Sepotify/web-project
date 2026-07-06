"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { canAccessDashboard } from "@/lib/dashboard";
import { useAuth } from "@/store/AuthContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !canAccessDashboard(user?.role)) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || !user || !canAccessDashboard(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-secondary">Loading dashboard...</p>
      </div>
    );
  }

  return <DashboardShell role={user.role}>{children}</DashboardShell>;
}
