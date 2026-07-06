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
  matchPrefix?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { href: "/", label: "Home", roles: ["listener", "artist", "support", "admin"] },
    ],
  },
  {
    title: "Library",
    items: [
      {
        href: "/albums",
        label: "Albums & tracks",
        roles: ["listener", "artist"],
        matchPrefix: true,
      },
      { href: "/playlists", label: "Playlists", roles: ["listener"], matchPrefix: true },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/profile", label: "Profile", roles: ["listener", "artist"], matchPrefix: true },
      { href: "/settings", label: "Settings", roles: ["listener", "artist"] },
    ],
  },
  {
    title: "More",
    items: [
      {
        href: "/notifications",
        label: "Notifications",
        roles: ["listener", "artist", "support", "admin"],
      },
      { href: "/artist/works", label: "My Works", roles: ["artist"] },
      { href: "/dashboard", label: "Dashboard", roles: ["support", "admin"] },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role)),
      ),
    }))
    .filter((section) => section.items.length > 0);

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
        <nav className="flex flex-col gap-5">
          {visibleSections.map((section) => (
            <div key={section.title ?? section.items[0]?.href} className="flex flex-col gap-1">
              {section.title && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = isNavItemActive(pathname, item);
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
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
