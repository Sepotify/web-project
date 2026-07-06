import { describe, expect, it } from "vitest";
import { calculateArtistEarnings } from "@/lib/admin";

describe("calculateArtistEarnings", () => {
  it("calculates monthly payout from stream count", () => {
    expect(calculateArtistEarnings(10000)).toBe(20);
    expect(calculateArtistEarnings(0)).toBe(0);
  });
});
