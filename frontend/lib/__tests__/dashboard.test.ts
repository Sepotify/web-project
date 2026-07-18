import { describe, expect, it } from "vitest";
import { getDashboardNavItems } from "@/lib/dashboard";

describe("getDashboardNavItems", () => {
  it("shows pricing and analytics only for admin users", () => {
    const supportNav = getDashboardNavItems("support");
    const adminNav = getDashboardNavItems("admin");

    expect(supportNav.map((item) => item.href)).toEqual([
      "/dashboard/artists",
      "/dashboard/tickets",
    ]);

    expect(adminNav.map((item) => item.href)).toEqual([
      "/dashboard/artists",
      "/dashboard/tickets",
      "/dashboard/finance",
      "/dashboard/pricing",
      "/dashboard/analytics",
    ]);
  });

  it("includes shared support routes for both support and admin", () => {
    const supportNav = getDashboardNavItems("support");
    const adminNav = getDashboardNavItems("admin");

    for (const href of ["/dashboard/artists", "/dashboard/tickets"]) {
      expect(supportNav.some((item) => item.href === href)).toBe(true);
      expect(adminNav.some((item) => item.href === href)).toBe(true);
    }
  });

  it("returns no dashboard navigation for listener and artist roles", () => {
    expect(getDashboardNavItems("listener")).toEqual([]);
    expect(getDashboardNavItems("artist")).toEqual([]);
    expect(getDashboardNavItems(undefined)).toEqual([]);
  });
});
