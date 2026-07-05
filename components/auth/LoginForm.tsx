"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { getRedirectPathForRole } from "@/lib/auth";
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

    if (!email.trim()) {
      nextErrors.email = "ایمیل الزامی است.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "فرمت ایمیل معتبر نیست.";
    }

    if (!password) {
      nextErrors.password = "رمز عبور الزامی است.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    const result = loginWithCredentials(email, password);
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      showToast(result.error ?? "ورود ناموفق بود.", "error");
      return;
    }

    showToast(`خوش آمدید، ${result.user.displayName}!`, "success");
    router.push(getRedirectPathForRole(result.user.role));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="ایمیل"
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
        dir="ltr"
        className="text-left"
      />

      <Input
        label="رمز عبور"
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
        dir="ltr"
        className="text-left"
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-text-secondary transition-colors hover:text-accent-primary"
        >
          فراموشی رمز عبور
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "در حال ورود..." : "ورود"}
      </Button>

      <p className="text-center text-sm text-text-muted">
        حساب کاربری ندارید؟{" "}
        <Link
          href="/register"
          className="font-medium text-accent-primary transition-colors hover:text-accent-primary-hover"
        >
          ثبت‌نام
        </Link>
      </p>
    </form>
  );
}
