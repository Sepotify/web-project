import { afterEach, describe, expect, it, vi } from "vitest";
import { createId } from "@/lib/utils";

describe("createId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses crypto.randomUUID when available", () => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "11111111-1111-4111-8111-111111111111",
    });
    expect(createId()).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("falls back when randomUUID is missing", () => {
    vi.stubGlobal("crypto", {});
    const id = createId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
