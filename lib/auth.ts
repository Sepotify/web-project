import { getUserByEmail } from "@/lib/storage";
import type { User, UserRole } from "@/types";

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

const ROLE_REDIRECT_PATHS: Record<UserRole, string> = {
  listener: "/",
  artist: "/",
  support: "/dashboard",
  admin: "/dashboard",
};

export function getRedirectPathForRole(role: UserRole): string {
  return ROLE_REDIRECT_PATHS[role];
}

export function authenticateUser(email: string, password: string): LoginResult {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { success: false, error: "ایمیل الزامی است." };
  }

  if (!password) {
    return { success: false, error: "رمز عبور الزامی است." };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return { success: false, error: "فرمت ایمیل معتبر نیست." };
  }

  const user = getUserByEmail(normalizedEmail);
  if (!user) {
    return { success: false, error: "ایمیل یا رمز عبور اشتباه است." };
  }

  if (user.password !== password) {
    return { success: false, error: "ایمیل یا رمز عبور اشتباه است." };
  }

  return { success: true, user };
}

export function requestPasswordReset(email: string): { success: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { success: false, error: "ایمیل الزامی است." };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return { success: false, error: "فرمت ایمیل معتبر نیست." };
  }

  const user = getUserByEmail(normalizedEmail);
  if (!user) {
    return { success: false, error: "حسابی با این ایمیل یافت نشد." };
  }

  return { success: true };
}
