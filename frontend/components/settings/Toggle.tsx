"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-lg border border-border-default bg-bg-elevated p-4",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
        )}
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent-primary",
            checked ? "bg-accent-primary" : "bg-bg-hover",
            disabled && "cursor-not-allowed",
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5",
          )}
        />
      </label>
    </div>
  );
}
