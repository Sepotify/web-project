"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types";

interface HomeHeaderProps {
  user: User;
}

export function HomeHeader({ user }: HomeHeaderProps) {
  return (
    <header className="flex items-center gap-4 sm:gap-5">
      <Link href="/profile" className="shrink-0 transition-opacity hover:opacity-90">
        <Avatar src={user.avatarUrl} alt={user.displayName} size="xl" />
      </Link>

      <div className="min-w-0">
        <p className="text-sm text-text-muted">Welcome back</p>
        <h1 className="truncate text-2xl font-bold text-text-primary sm:text-3xl">
          {user.displayName}
        </h1>
      </div>
    </header>
  );
}
