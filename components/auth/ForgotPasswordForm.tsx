"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { requestPasswordReset } from "@/lib/auth";

export function ForgotPasswordForm() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const result = requestPasswordReset(email);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setError(undefined);
    setIsSubmitted(true);
    showToast("لینک بازیابی رمز عبور به ایمیل شما ارسال شد.", "success");
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-text-secondary">
          اگر حسابی با ایمیل{" "}
          <span className="font-medium text-text-primary" dir="ltr">
            {email.trim()}
          </span>{" "}
          وجود داشته باشد، لینک بازیابی رمز عبور برای شما ارسال شده است.
        </p>
        <Link href="/login">
          <Button variant="secondary" className="w-full">
            بازگشت به ورود
          </Button>
        </Link>
      </div>
    );
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
          if (error) setError(undefined);
        }}
        error={error}
        dir="ltr"
        className="text-left"
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "در حال ارسال..." : "ارسال لینک بازیابی"}
      </Button>

      <p className="text-center text-sm text-text-muted">
        <Link
          href="/login"
          className="font-medium text-accent-primary transition-colors hover:text-accent-primary-hover"
        >
          بازگشت به ورود
        </Link>
      </p>
    </form>
  );
}
