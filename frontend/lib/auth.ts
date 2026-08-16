import {
  addPasswordResetRequest,
  getArtistByUserId,
  getUserByEmail,
} from "@/lib/storage";
import { createId } from "@/lib/utils";
import type { User, UserRole } from "@/types";

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const ROLE_REDIRECT_PATHS: Record<UserRole, string> = {
  listener: "/",
  artist: "/",
  support: "/dashboard",
  admin: "/dashboard",
};

export function getRedirectPathForRole(role: UserRole): string {
  return ROLE_REDIRECT_PATHS[role];
}

export function getRedirectPathForUser(user: User): string {
  if (user.role === "artist") {
    if (user.artistStatus === "pending" || user.artistStatus === "rejected") {
      return "/register/pending";
    }

    const artist = getArtistByUserId(user.id);
    if (artist?.status === "pending" || artist?.status === "rejected") {
      return "/register/pending";
    }
  }
  return getRedirectPathForRole(user.role);
}

export function validateEmail(email: string): string | undefined {
  const normalized = email.trim();

  if (!normalized) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return "Please enter a valid email address.";
  }

  return undefined;
}

export function authenticateUser(email: string, password: string): LoginResult {
  const emailError = validateEmail(email);
  if (emailError) {
    return { success: false, error: emailError };
  }

  if (!password) {
    return { success: false, error: "Password is required." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = getUserByEmail(normalizedEmail);

  if (!user || user.password !== password) {
    return { success: false, error: "Invalid email or password." };
  }

  return { success: true, user };
}

export function requestPasswordReset(email: string): PasswordResetResult {
  const emailError = validateEmail(email);
  if (emailError) {
    return { success: false, error: emailError };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = getUserByEmail(normalizedEmail);

  if (!user) {
    return { success: false, error: "No account found with this email." };
  }

  const now = Date.now();
  const token = createId();

  addPasswordResetRequest({
    id: createId(),
    userId: user.id,
    email: normalizedEmail,
    token,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + RESET_TOKEN_TTL_MS).toISOString(),
  });

  return { success: true };
}
