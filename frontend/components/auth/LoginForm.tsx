"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { getRedirectPathForUser, validateEmail } from "@/lib/auth";
import { useAuth } from "@/store/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const { loginWithCredentials } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm(): boolean {
    const nextErrors: { email?: string; password?: string } = {};

    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    const result = await loginWithCredentials(email, password);
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      showToast(result.error ?? "Login failed.", "error");
      return;
    }

    showToast(`Welcome back, ${result.user.displayName}!`, "success");
    router.push(getRedirectPathForUser(result.user));
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4" noValidate>
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="example@email.com"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        error={errors.email}
      />

      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={errors.password}
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-text-secondary underline-offset-4 transition-colors hover:text-accent-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-accent-primary transition-colors hover:text-accent-primary-hover"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
