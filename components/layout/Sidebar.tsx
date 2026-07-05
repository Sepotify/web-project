"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/", label: "خانه", roles: ["listener", "artist", "support", "admin"] },
  { href: "/albums", label: "آلبوم‌ها", roles: ["listener", "artist"] },
  { href: "/playlists", label: "پلی‌لیست‌ها", roles: ["listener"] },
  { href: "/profile", label: "پروفایل", roles: ["listener", "artist"] },
  { href: "/settings", label: "تنظیمات", roles: ["listener", "artist"] },
  { href: "/notifications", label: "اعلانات", roles: ["listener", "artist", "support", "admin"] },
  { href: "/artist/works", label: "آثار من", roles: ["artist"] },
  { href: "/dashboard", label: "داشبورد", roles: ["support", "admin"] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

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
          "fixed right-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-l border-border-default bg-bg-secondary p-4 transition-transform md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        )}
      >
        <nav className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
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
