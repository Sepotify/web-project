"use client";

import Link from "next/link";
import { useAuth } from "@/store/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

const roleLabels: Record<string, string> = {
  listener: "Listener",
  artist: "Artist",
  support: "Support",
  admin: "Admin",
};

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border-default bg-bg-secondary px-4 md:px-6">
      <Link href="/" className="text-lg font-bold text-text-primary">
        Mock<span className="text-accent-primary">Spotify</span>
      </Link>

      <nav className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
              <div className="text-sm">
                <p className="font-medium text-text-primary">{user.displayName}</p>
                <p className="text-xs text-text-muted">{roleLabels[user.role]}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button size="sm">Sign in</Button>
          </Link>
        )}
      </nav>
    </header>
  );
}
