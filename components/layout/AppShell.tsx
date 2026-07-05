"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import { Button } from "@/components/ui/Button";
import { usePlayer } from "@/hooks/usePlayer";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentSong } = usePlayer();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center gap-2 border-b border-border-default bg-bg-secondary px-4 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </Button>
        <span className="text-sm font-medium text-text-primary">Menu</span>
      </div>

      <Navbar />

      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main
          className={cn(
            "flex-1 overflow-auto p-4 md:p-6",
            currentSong && "pb-24 md:pb-28",
          )}
        >
          {children}
        </main>
      </div>

      <MusicPlayer />
    </div>
  );
}
