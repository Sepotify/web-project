"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDashboardNavItems } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface DashboardSidebarProps {
  role: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ role, isOpen = true, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = getDashboardNavItems(role);

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r border-border-default bg-bg-secondary p-4 transition-transform md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="mb-4 px-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Staff panel
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {role === "admin" ? "System admin" : "Support team"}
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.matchPrefix && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-bg-hover text-text-primary"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
