"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrivacyPolicyModal } from "@/components/auth/PrivacyPolicyModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import {
  validateRegisterListenerInput,
  type RegisterListenerErrors,
  type RegisterListenerInput,
} from "@/lib/register";
import { useAuth } from "@/store/AuthContext";
import type { Gender } from "@/types";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const INITIAL_FORM: RegisterListenerInput = {
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
  birthDate: "",
  gender: "",
  acceptedPrivacyPolicy: false,
};

export function RegisterForm() {
  const router = useRouter();
  const { registerListener: registerAndSignIn } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState<RegisterListenerInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<RegisterListenerErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function updateField<K extends keyof RegisterListenerInput>(
    field: K,
    value: RegisterListenerInput[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateRegisterListenerInput(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const result = registerAndSignIn(form);
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      if (result.errors) {
        setErrors(result.errors);
      }
      showToast(result.error ?? "Registration failed.", "error");
      return;
    }

    showToast(`Welcome, ${result.user.displayName}!`, "success");
    router.push("/");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Display name"
          name="displayName"
          autoComplete="name"
          placeholder="How should we call you?"
          value={form.displayName}
          onChange={(event) => updateField("displayName", event.target.value)}
          error={errors.displayName}
        />

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="example@email.com"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          error={errors.email}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          error={errors.password}
        />

        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={(event) => updateField("confirmPassword", event.target.value)}
          error={errors.confirmPassword}
        />

        <Input
          label="Date of birth"
          type="date"
          name="birthDate"
          autoComplete="bday"
          max={today}
          value={form.birthDate}
          onChange={(event) => updateField("birthDate", event.target.value)}
          error={errors.birthDate}
        />

        <Select
          label="Gender"
          name="gender"
          placeholder="Select gender"
          options={GENDER_OPTIONS}
          value={form.gender}
          onChange={(event) => updateField("gender", event.target.value as Gender | "")}
          error={errors.gender}
        />

        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={form.acceptedPrivacyPolicy}
              onChange={(event) =>
                updateField("acceptedPrivacyPolicy", event.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded border-border-default bg-bg-elevated accent-accent-primary"
            />
            <span>
              I accept the{" "}
              <button
                type="button"
                onClick={() => setIsPrivacyPolicyOpen(true)}
                className="font-medium text-accent-primary underline-offset-4 hover:underline"
              >
                privacy policy
              </button>
            </span>
          </label>
          {errors.acceptedPrivacyPolicy && (
            <p className="text-xs text-accent-danger">{errors.acceptedPrivacyPolicy}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent-primary transition-colors hover:text-accent-primary-hover"
          >
            Sign in
          </Link>
        </p>
      </form>

      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />
    </>
  );
}
