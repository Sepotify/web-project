"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { requestPasswordReset, validateEmail } from "@/lib/auth";

export function ForgotPasswordForm() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsSubmitting(true);
    const result = requestPasswordReset(email);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      showToast(result.error ?? "Request failed.", "error");
      return;
    }

    setError(undefined);
    setIsSubmitted(true);
    showToast("Password reset link sent to your email.", "success");
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary/15 text-2xl text-accent-primary"
          aria-hidden="true"
        >
          ✓
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-text-primary">
            Request submitted
          </h2>
          <p className="text-sm leading-6 text-text-secondary">
            A password reset link has been sent to{" "}
            <span className="font-medium text-text-primary">{email.trim()}</span>.
            Please check your inbox.
          </p>
          <p className="text-xs text-text-muted">
            In Phase 1, email delivery is mocked and the request is stored in
            localStorage.
          </p>
        </div>
        <Link href="/login" className="w-full">
          <Button variant="secondary" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm leading-6 text-text-secondary">
        Enter the email address you used to sign up. We&apos;ll send you a link
        to recover your account.
      </p>

      <Input
        label="Email"
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
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-text-muted">
        <Link
          href="/login"
          className="font-medium text-accent-primary transition-colors hover:text-accent-primary-hover"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
