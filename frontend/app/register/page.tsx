"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArtistRegisterForm } from "@/components/auth/ArtistRegisterForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { RegisterTabs, type RegisterTab } from "@/components/auth/RegisterTabs";
import { getRedirectPathForUser } from "@/lib/auth";
import { useAuth } from "@/store/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<RegisterTab>("listener");

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getRedirectPathForUser(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        activeTab === "listener"
          ? "Join Mock Spotify and start listening"
          : "Apply as an artist and share your music"
      }
      maxWidth="xl"
    >
      <RegisterTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "listener" ? <RegisterForm /> : <ArtistRegisterForm />}
    </AuthLayout>
  );
}
