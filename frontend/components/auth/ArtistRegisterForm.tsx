"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrivacyPolicyCheckbox } from "@/components/auth/PrivacyPolicyCheckbox";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import {
  validateRegisterArtistInput,
  type RegisterArtistErrors,
  type RegisterArtistInput,
} from "@/lib/register";
import { useAuth } from "@/store/AuthContext";

const INITIAL_FORM: RegisterArtistInput = {
  email: "",
  password: "",
  confirmPassword: "",
  stageName: "",
  portfolio: "",
  acceptedPrivacyPolicy: false,
};

export function ArtistRegisterForm() {
  const router = useRouter();
  const { registerArtist } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState<RegisterArtistInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<RegisterArtistErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof RegisterArtistInput>(
    field: K,
    value: RegisterArtistInput[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateRegisterArtistInput(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const result = registerArtist(form);
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      if (result.errors) {
        setErrors(result.errors as RegisterArtistErrors);
      }
      showToast(result.error ?? "Registration failed.", "error");
      return;
    }

    showToast("Artist application submitted successfully.", "success");
    router.push("/register/pending");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm leading-6 text-text-secondary">
        Apply for an artist account. Your profile will be reviewed by our support team
        before you can publish music.
      </p>

      <Input
        label="Stage name"
        name="stageName"
        autoComplete="nickname"
        placeholder="Your artist name"
        value={form.stageName}
        onChange={(event) => updateField("stageName", event.target.value)}
        error={errors.stageName}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>

      <Textarea
        label="Portfolio / sample works"
        name="portfolio"
        placeholder="Share links or describe your sample works for review..."
        value={form.portfolio}
        onChange={(event) => updateField("portfolio", event.target.value)}
        error={errors.portfolio}
      />

      <PrivacyPolicyCheckbox
        checked={form.acceptedPrivacyPolicy}
        onChange={(checked) => updateField("acceptedPrivacyPolicy", checked)}
        error={errors.acceptedPrivacyPolicy}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting application..." : "Submit artist application"}
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
  );
}
