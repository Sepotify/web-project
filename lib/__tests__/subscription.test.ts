import { describe, expect, it } from "vitest";
import { canViewGoldStats } from "@/lib/subscription";

describe("canViewGoldStats", () => {
  it("allows gold subscribers to view gold-only stats", () => {
    expect(canViewGoldStats("gold")).toBe(true);
  });

  it("blocks basic and silver subscribers from gold-only stats", () => {
    expect(canViewGoldStats("basic")).toBe(false);
    expect(canViewGoldStats("silver")).toBe(false);
  });

  it("blocks unauthenticated users from gold-only stats", () => {
    expect(canViewGoldStats(undefined)).toBe(false);
  });
});
