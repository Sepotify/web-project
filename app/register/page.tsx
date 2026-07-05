"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getRedirectPathForRole } from "@/lib/auth";
import { useAuth } from "@/store/AuthContext";

export default function RegisterPage() {
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
      title="Create your account"
      subtitle="Join Mock Spotify and start listening"
      maxWidth="lg"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
