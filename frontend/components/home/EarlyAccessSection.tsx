import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { HomeSection } from "@/components/home/HomeSection";
import { cn } from "@/lib/utils";

interface EarlyAccessSectionProps {
  children: ReactNode;
  className?: string;
}

export function EarlyAccessSection({ children, className }: EarlyAccessSectionProps) {
  return (
    <HomeSection
      title="Early access"
      seeAllHref="/albums"
      seeAllLabel="Explore library"
      className={cn(
        "rounded-xl border border-accent-warning/30 bg-gradient-to-br from-accent-warning/10 via-bg-elevated to-bg-elevated p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="warning">Gold exclusive</Badge>
        <p className="text-sm text-text-secondary">
          Listen before everyone else with your Gold subscription.
        </p>
      </div>
      <div className="mt-4">{children}</div>
    </HomeSection>
  );
}
