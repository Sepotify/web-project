"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@/types";

interface DashboardShellProps {
  children: ReactNode;
  role: UserRole;
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center gap-2 border-b border-border-default bg-bg-secondary px-4 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open dashboard menu"
        >
          ☰
        </Button>
        <span className="text-sm font-medium text-text-primary">Dashboard menu</span>
      </div>

      <Navbar />

      <div className="flex flex-1">
        <DashboardSidebar
          role={role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
