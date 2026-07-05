import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
}

export function Card({ children, hoverable = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-bg-elevated p-4 border border-border-default",
        hoverable && "transition-colors hover:bg-bg-hover cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
