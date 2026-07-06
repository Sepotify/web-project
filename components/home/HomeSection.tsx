import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HomeSectionProps {
  title: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  children: ReactNode;
  className?: string;
}

export function HomeSection({
  title,
  seeAllHref,
  seeAllLabel = "See all",
  children,
  className,
}: HomeSectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary sm:text-xl">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="shrink-0 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            {seeAllLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
