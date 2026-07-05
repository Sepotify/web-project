import type { ReactNode } from "react";
import Link from "next/link";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: "md" | "lg";
}

export function AuthLayout({ title, subtitle, children, maxWidth = "md" }: AuthLayoutProps) {
  const widthClass = maxWidth === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 py-8">
      <div className="mb-8 text-center">
        <Link href="/" className="text-2xl font-bold text-text-primary">
          Mock<span className="text-accent-primary">Spotify</span>
        </Link>
      </div>

      <div
        className={`w-full ${widthClass} rounded-xl border border-border-default bg-bg-secondary p-6 shadow-lg md:p-8`}
      >
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
