"use client";

import { Select } from "@/components/ui/Select";
import { LANGUAGE_OPTIONS } from "@/lib/settings";
import type { AppSettings } from "@/types";

interface LanguageSettingsProps {
  language: AppSettings["language"];
  onChange: (language: AppSettings["language"]) => void;
}

export function LanguageSettings({ language, onChange }: LanguageSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <Select
        label="App language"
        options={LANGUAGE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        value={language}
        onChange={(event) => onChange(event.target.value as AppSettings["language"])}
      />
      <p className="text-xs text-text-muted">
        Your language preference is saved locally. Full translation support will be
        available in Phase 2.
      </p>
    </div>
  );
}
