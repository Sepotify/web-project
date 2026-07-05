"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { getRedirectPathForUser } from "@/lib/auth";
import { useAuth } from "@/store/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getRedirectPathForUser(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your email and password to continue"
    >
      <LoginForm />
      <DemoAccountsHint />
    </AuthLayout>
  );
}

function DemoAccountsHint() {
  const accounts = [
    { role: "Listener", email: "listener@example.com" },
    { role: "Artist", email: "artist@example.com" },
    { role: "Support", email: "support@example.com" },
    { role: "Admin", email: "admin@example.com" },
  ];

  return (
    <div className="mt-6 rounded-lg border border-border-default bg-bg-elevated p-4">
      <p className="mb-2 text-xs font-medium text-text-secondary">
        Demo accounts (password: 123456)
      </p>
      <ul className="flex flex-col gap-1 text-xs text-text-muted">
        {accounts.map((account) => (
          <li key={account.email} className="flex justify-between gap-2">
            <span>{account.role}</span>
            <span>{account.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
