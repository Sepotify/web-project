"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PrivacyPolicyContent } from "@/components/auth/PrivacyPolicyContent";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" className="max-w-2xl">
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <PrivacyPolicyContent />
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link href="/privacy-policy" className="flex-1" onClick={onClose}>
          <Button variant="secondary" className="w-full">
            Open full page
          </Button>
        </Link>
        <Button className="flex-1" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
