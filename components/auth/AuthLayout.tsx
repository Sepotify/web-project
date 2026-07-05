import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: "md" | "lg" | "xl";
}

const widthClasses = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
} as const;

export function AuthLayout({
  title,
  subtitle,
  children,
  maxWidth = "md",
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 py-6 sm:px-6 sm:py-8 md:py-12">
      <div className="mb-6 text-center sm:mb-8">
        <Link href="/" className="text-xl font-bold text-text-primary sm:text-2xl">
          Mock<span className="text-accent-primary">Spotify</span>
        </Link>
      </div>

      <div
        className={cn(
          "w-full rounded-xl border border-border-default bg-bg-secondary p-5 shadow-lg sm:p-6 md:p-8",
          widthClasses[maxWidth],
        )}
      >
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold text-text-primary sm:text-xl md:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-6 text-text-secondary">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
