"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { getRedirectPathForRole } from "@/lib/auth";
import { useAuth } from "@/store/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getRedirectPathForRole(user.role));
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-secondary">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <AuthLayout
      title="ورود به حساب کاربری"
      subtitle="با ایمیل و رمز عبور خود وارد شوید"
    >
      <LoginForm />
      <DemoAccountsHint />
    </AuthLayout>
  );
}

function DemoAccountsHint() {
  const accounts = [
    { role: "شنونده", email: "listener@example.com" },
    { role: "هنرمند", email: "artist@example.com" },
    { role: "پشتیبان", email: "support@example.com" },
    { role: "مدیر", email: "admin@example.com" },
  ];

  return (
    <div className="mt-6 rounded-lg border border-border-default bg-bg-elevated p-4">
      <p className="mb-2 text-xs font-medium text-text-secondary">
        حساب‌های آزمایشی (رمز عبور: 123456)
      </p>
      <ul className="flex flex-col gap-1 text-xs text-text-muted">
        {accounts.map((account) => (
          <li key={account.email} className="flex justify-between gap-2">
            <span>{account.role}</span>
            <span dir="ltr">{account.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
