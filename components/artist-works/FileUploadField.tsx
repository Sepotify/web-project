"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/artist-works";

interface FileUploadFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
  error?: string;
  selectedFile?: File | null;
  preview?: ReactNode;
  onFileSelect: (file: File | null) => void;
}

export function FileUploadField({
  label,
  hint,
  error,
  selectedFile,
  preview,
  onFileSelect,
  className,
  id,
  accept,
  ...props
}: FileUploadFieldProps) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
        {label}
      </label>

      <div
        className={cn(
          "rounded-md border border-dashed border-border-default bg-bg-elevated p-4",
          error && "border-accent-danger",
          className,
        )}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="block w-full text-sm text-text-secondary file:mr-4 file:rounded-full file:border-0 file:bg-bg-hover file:px-4 file:py-2 file:text-sm file:font-medium file:text-text-primary hover:file:bg-bg-primary"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            onFileSelect(file);
          }}
          {...props}
        />

        {selectedFile && (
          <p className="mt-2 text-xs text-text-muted">
            Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        )}

        {preview && <div className="mt-3">{preview}</div>}
      </div>

      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-accent-danger">{error}</p>}
    </div>
  );
}
