"use client";

import { cn } from "@/lib/utils";

export type RegisterTab = "listener" | "artist";

interface RegisterTabsProps {
  activeTab: RegisterTab;
  onTabChange: (tab: RegisterTab) => void;
}

const tabs: { id: RegisterTab; label: string }[] = [
  { id: "listener", label: "Listener" },
  { id: "artist", label: "Artist" },
];

export function RegisterTabs({ activeTab, onTabChange }: RegisterTabsProps) {
  return (
    <div
      className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-bg-elevated p-1"
      role="tablist"
      aria-label="Registration type"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4",
              isActive
                ? "bg-accent-primary text-black"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
