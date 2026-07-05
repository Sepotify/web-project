import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="بازیابی رمز عبور"
      subtitle="ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
