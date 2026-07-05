"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" className="max-w-lg">
      <div className="max-h-[60vh] space-y-4 overflow-y-auto text-sm leading-6 text-text-secondary">
        <p>
          Mock Spotify collects basic account information such as your display name,
          email address, date of birth, and gender to provide personalized music
          streaming services.
        </p>
        <p>
          Your listening activity, playlists, and preferences may be stored locally
          during Phase 1 and synced with our servers in later phases.
        </p>
        <p>
          We do not sell your personal data. You may request account deletion at
          any time from the app settings page.
        </p>
        <p>
          By creating an account, you agree to our terms of service and consent to
          the collection and use of your information as described in this policy.
        </p>
      </div>
      <div className="mt-6">
        <Button className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
