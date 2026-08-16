export const PAYMENT_DURATIONS = [1, 3, 6, 12] as const;

export type PaymentDuration = (typeof PAYMENT_DURATIONS)[number];

export type PaidTier = "silver" | "gold";

export function calculatePaymentAmount(monthlyPrice: number, months: number): number {
  return monthlyPrice * months;
}

export function formatPaymentAmount(value: number): string {
  return value.toLocaleString();
}

export function durationLabel(months: number): string {
  return months === 1 ? "1 month" : `${months} months`;
}
