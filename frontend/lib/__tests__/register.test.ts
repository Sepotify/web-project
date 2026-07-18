import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({
  getUserByEmail: vi.fn(() => undefined),
  getUsers: vi.fn(() => []),
}));

import { validateRegisterListenerInput } from "@/lib/register";

const validListenerInput = {
  displayName: "Sam Listener",
  email: "sam@example.com",
  password: "123456",
  confirmPassword: "123456",
  birthDate: "2000-01-15",
  gender: "male" as const,
  acceptedPrivacyPolicy: true,
};

describe("validateRegisterListenerInput", () => {
  it("accepts a complete listener registration form", () => {
    expect(validateRegisterListenerInput(validListenerInput)).toEqual({});
  });

  it("requires display name, email, password, birth date, gender, and privacy policy", () => {
    const errors = validateRegisterListenerInput({
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      birthDate: "",
      gender: "",
      acceptedPrivacyPolicy: false,
    });

    expect(errors.displayName).toBe("Display name is required.");
    expect(errors.email).toBe("Email is required.");
    expect(errors.password).toBe("Password is required.");
    expect(errors.confirmPassword).toBe("Please confirm your password.");
    expect(errors.birthDate).toBe("Date of birth is required.");
    expect(errors.gender).toBe("Please select a gender.");
    expect(errors.acceptedPrivacyPolicy).toBe("You must accept the privacy policy.");
  });

  it("rejects mismatched passwords", () => {
    const errors = validateRegisterListenerInput({
      ...validListenerInput,
      confirmPassword: "654321",
    });

    expect(errors.confirmPassword).toBe("Passwords do not match.");
  });
});
