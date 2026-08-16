"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api/client";
import { apiVerifyPayment } from "@/lib/api/endpoints";
import { formatPaymentAmount } from "@/lib/payments";
import { SUBSCRIPTION_LABELS } from "@/lib/profile";
import { useAuth } from "@/store/AuthContext";

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-text-secondary">Confirming payment...</p>
          </div>
        </AppShell>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Confirming your payment...");
  const [tierLabel, setTierLabel] = useState("");
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    const authority = searchParams.get("Authority") || searchParams.get("authority");
    const gatewayStatus = searchParams.get("Status") || searchParams.get("status") || "OK";

    if (!authority) {
      setState("failed");
      setMessage("Missing payment authority. Please try checkout again.");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const result = await apiVerifyPayment({
          authority,
          status: gatewayStatus,
        });
        if (cancelled) return;
        if (result.status === "success") {
          setState("success");
          setTierLabel(SUBSCRIPTION_LABELS[result.tier]);
          setAmount(result.amount);
          setMessage(
            result.already_verified
              ? "This payment was already confirmed."
              : "Payment confirmed. Your subscription is now active.",
          );
          await refreshUser();
        } else {
          setState("failed");
          setMessage("Payment was not completed. Your plan was not changed.");
        }
      } catch (error) {
        if (cancelled) return;
        setState("failed");
        setMessage(
          error instanceof ApiError
            ? error.message
            : "Could not verify the payment. Please contact support if you were charged.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshUser, searchParams]);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <h1 className="text-2xl font-bold text-text-primary">
            {state === "loading" && "Confirming payment"}
            {state === "success" && "Payment successful"}
            {state === "failed" && "Payment failed"}
          </h1>
          <p className="text-sm leading-6 text-text-secondary">{message}</p>
          {state === "success" && (
            <p className="text-sm text-text-primary">
              Plan: <span className="font-semibold">{tierLabel}</span>
              {amount != null && (
                <>
                  {" "}
                  · Amount: {formatPaymentAmount(amount)}
                </>
              )}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/settings" className="flex-1">
              <Button className="w-full" disabled={state === "loading"}>
                Back to settings
              </Button>
            </Link>
            {state === "failed" && (
              <Link href="/payment" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Try again
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
