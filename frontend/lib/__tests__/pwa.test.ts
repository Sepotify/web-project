import { describe, expect, it } from "vitest";
import {
  isNavigationRequest,
  shouldBypassServiceWorker,
  shouldPrecachePath,
} from "@/lib/pwa";

describe("PWA service worker helpers", () => {
  it("does not cache API or Django media requests", () => {
    expect(shouldBypassServiceWorker("http://localhost:3000/api/auth/login/")).toBe(true);
    expect(shouldBypassServiceWorker("http://127.0.0.1:8000/media/audio/a.mp3")).toBe(true);
    expect(shouldBypassServiceWorker("http://localhost:3000/playlists")).toBe(false);
  });

  it("treats document loads as navigation", () => {
    expect(isNavigationRequest({ mode: "navigate" })).toBe(true);
    expect(isNavigationRequest({ destination: "script" })).toBe(false);
  });

  it("precaches the app shell and icons", () => {
    expect(shouldPrecachePath("/")).toBe(true);
    expect(shouldPrecachePath("/offline")).toBe(true);
    expect(shouldPrecachePath("/icons/icon-192.png")).toBe(true);
    expect(shouldPrecachePath("/settings")).toBe(false);
  });
});
