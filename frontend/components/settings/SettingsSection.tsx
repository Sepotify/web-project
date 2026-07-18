import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border-default bg-bg-secondary p-4 sm:p-5 md:p-6",
        className,
      )}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text-primary sm:text-lg">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
