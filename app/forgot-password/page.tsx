"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getRedirectPathForRole } from "@/lib/auth";
import { useAuth } from "@/store/AuthContext";

export default function ForgotPasswordPage() {
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
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a recovery link"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
