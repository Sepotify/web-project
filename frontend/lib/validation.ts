import { validateEmail } from "@/lib/auth";
import { getUserByEmail } from "@/lib/storage";

export const MIN_PASSWORD_LENGTH = 6;
export const MIN_NAME_LENGTH = 2;
export const MIN_PORTFOLIO_LENGTH = 10;

export function validateRequired(value: string, fieldLabel: string): string | undefined {
  if (!value.trim()) {
    return `${fieldLabel} is required.`;
  }
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return undefined;
}

export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (!confirmPassword) {
    return "Please confirm your password.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return undefined;
}

export function validateUniqueEmail(email: string): string | undefined {
  const emailError = validateEmail(email);
  if (emailError) return emailError;
  if (getUserByEmail(email)) {
    return "An account with this email already exists.";
  }
  return undefined;
}

export function validatePrivacyPolicyAccepted(accepted: boolean): string | undefined {
  if (!accepted) {
    return "You must accept the privacy policy.";
  }
  return undefined;
}

export function validateBirthDate(birthDate: string): string | undefined {
  if (!birthDate) {
    return "Date of birth is required.";
  }

  const parsed = new Date(birthDate);
  const today = new Date();

  if (Number.isNaN(parsed.getTime())) {
    return "Please enter a valid date of birth.";
  }
  if (parsed > today) {
    return "Date of birth cannot be in the future.";
  }
  return undefined;
}
