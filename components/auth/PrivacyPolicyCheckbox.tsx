"use client";

import { useState } from "react";
import { PrivacyPolicyModal } from "@/components/auth/PrivacyPolicyModal";

interface PrivacyPolicyCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function PrivacyPolicyCheckbox({
  checked,
  onChange,
  error,
}: PrivacyPolicyCheckboxProps) {
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-default bg-bg-elevated accent-accent-primary"
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
        {error && <p className="text-xs text-accent-danger">{error}</p>}
      </div>

      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />
    </>
  );
}
