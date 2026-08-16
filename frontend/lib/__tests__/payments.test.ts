import { describe, expect, it } from "vitest";
import {
  PAYMENT_DURATIONS,
  calculatePaymentAmount,
  durationLabel,
} from "@/lib/payments";

describe("payment amounts", () => {
  it("multiplies monthly price by duration", () => {
    expect(calculatePaymentAmount(199000, 3)).toBe(597000);
    expect(calculatePaymentAmount(99000, 1)).toBe(99000);
  });

  it("supports 1, 3, 6, and 12 month plans", () => {
    expect([...PAYMENT_DURATIONS]).toEqual([1, 3, 6, 12]);
    expect(durationLabel(1)).toBe("1 month");
    expect(durationLabel(12)).toBe("12 months");
  });
});
