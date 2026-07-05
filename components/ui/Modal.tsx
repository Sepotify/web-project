"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl bg-bg-secondary border border-border-default p-6 shadow-lg",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2 id="modal-title" className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
