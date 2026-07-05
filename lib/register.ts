import { addSubscription, addUser, getUserByEmail, getUsers } from "@/lib/storage";
import { validateEmail } from "@/lib/auth";
import type { Gender, User } from "@/types";

export interface RegisterListenerInput {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  gender: Gender | "";
  acceptedPrivacyPolicy: boolean;
}

export interface RegisterListenerErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  birthDate?: string;
  gender?: string;
  acceptedPrivacyPolicy?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  errors?: RegisterListenerErrors;
  error?: string;
}

const MIN_PASSWORD_LENGTH = 6;
const MIN_DISPLAY_NAME_LENGTH = 2;

const GENDER_VALUES: Gender[] = ["male", "female", "other", "prefer_not_to_say"];

function generateUsername(displayName: string): string {
  const base =
    displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24) || "user";

  const existingUsernames = new Set(getUsers().map((user) => user.username));
  if (!existingUsernames.has(base)) return base;

  let suffix = 1;
  while (existingUsernames.has(`${base}_${suffix}`)) {
    suffix += 1;
  }

  return `${base}_${suffix}`;
}

export function validateRegisterListenerInput(
  input: RegisterListenerInput,
): RegisterListenerErrors {
  const errors: RegisterListenerErrors = {};

  const displayName = input.displayName.trim();
  if (!displayName) {
    errors.displayName = "Display name is required.";
  } else if (displayName.length < MIN_DISPLAY_NAME_LENGTH) {
    errors.displayName = `Display name must be at least ${MIN_DISPLAY_NAME_LENGTH} characters.`;
  }

  const emailError = validateEmail(input.email);
  if (emailError) {
    errors.email = emailError;
  } else if (getUserByEmail(input.email)) {
    errors.email = "An account with this email already exists.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  } else if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!input.birthDate) {
    errors.birthDate = "Date of birth is required.";
  } else {
    const birthDate = new Date(input.birthDate);
    const today = new Date();

    if (Number.isNaN(birthDate.getTime())) {
      errors.birthDate = "Please enter a valid date of birth.";
    } else if (birthDate > today) {
      errors.birthDate = "Date of birth cannot be in the future.";
    }
  }

  if (!input.gender || !GENDER_VALUES.includes(input.gender)) {
    errors.gender = "Please select a gender.";
  }

  if (!input.acceptedPrivacyPolicy) {
    errors.acceptedPrivacyPolicy = "You must accept the privacy policy.";
  }

  return errors;
}

export function registerListener(input: RegisterListenerInput): RegisterResult {
  const errors = validateRegisterListenerInput(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();

  const user: User = {
    id: userId,
    email: input.email.trim().toLowerCase(),
    password: input.password,
    displayName: input.displayName.trim(),
    username: generateUsername(input.displayName),
    role: "listener",
    subscription: "basic",
    birthDate: input.birthDate,
    gender: input.gender as Gender,
    followerIds: [],
    followingUserIds: [],
    followingArtistIds: [],
    dailyStreamCount: 0,
    createdAt: now,
  };

  addUser(user);
  addSubscription({
    id: crypto.randomUUID(),
    userId,
    tier: "basic",
    startDate: now,
    isActive: true,
  });

  return { success: true, user };
}
