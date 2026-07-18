import { AuthLayout } from "@/components/auth/AuthLayout";
import { PrivacyPolicyContent } from "@/components/auth/PrivacyPolicyContent";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PrivacyPolicyPage() {
  return (
    <AuthLayout
      title="Privacy Policy"
      subtitle="How Mock Spotify handles your personal information"
      maxWidth="xl"
    >
      <PrivacyPolicyContent />
      <div className="mt-6">
        <Link href="/register">
          <Button variant="secondary" className="w-full">
            Back to sign up
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
