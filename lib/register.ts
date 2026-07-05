import {
  addArtist,
  addSubscription,
  addUser,
  getUsers,
} from "@/lib/storage";
import {
  MIN_NAME_LENGTH,
  MIN_PORTFOLIO_LENGTH,
  validateBirthDate,
  validatePassword,
  validatePasswordConfirmation,
  validatePrivacyPolicyAccepted,
  validateRequired,
  validateUniqueEmail,
} from "@/lib/validation";
import type { Artist, Gender, User } from "@/types";

export interface RegisterListenerInput {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  gender: Gender | "";
  acceptedPrivacyPolicy: boolean;
}

export interface RegisterArtistInput {
  email: string;
  password: string;
  confirmPassword: string;
  stageName: string;
  portfolio: string;
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

export interface RegisterArtistErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  stageName?: string;
  portfolio?: string;
  acceptedPrivacyPolicy?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  artist?: Artist;
  errors?: RegisterListenerErrors | RegisterArtistErrors;
  error?: string;
}

const GENDER_VALUES: Gender[] = ["male", "female", "other", "prefer_not_to_say"];

function generateUsername(name: string): string {
  const base =
    name
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

  const displayNameError = validateRequired(input.displayName, "Display name");
  if (displayNameError) {
    errors.displayName = displayNameError;
  } else if (input.displayName.trim().length < MIN_NAME_LENGTH) {
    errors.displayName = `Display name must be at least ${MIN_NAME_LENGTH} characters.`;
  }

  const emailError = validateUniqueEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;

  const confirmError = validatePasswordConfirmation(input.password, input.confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;

  const birthDateError = validateBirthDate(input.birthDate);
  if (birthDateError) errors.birthDate = birthDateError;

  if (!input.gender || !GENDER_VALUES.includes(input.gender)) {
    errors.gender = "Please select a gender.";
  }

  const privacyError = validatePrivacyPolicyAccepted(input.acceptedPrivacyPolicy);
  if (privacyError) errors.acceptedPrivacyPolicy = privacyError;

  return errors;
}

export function validateRegisterArtistInput(
  input: RegisterArtistInput,
): RegisterArtistErrors {
  const errors: RegisterArtistErrors = {};

  const emailError = validateUniqueEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;

  const confirmError = validatePasswordConfirmation(input.password, input.confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;

  const stageNameError = validateRequired(input.stageName, "Stage name");
  if (stageNameError) {
    errors.stageName = stageNameError;
  } else if (input.stageName.trim().length < MIN_NAME_LENGTH) {
    errors.stageName = `Stage name must be at least ${MIN_NAME_LENGTH} characters.`;
  }

  const portfolioError = validateRequired(input.portfolio, "Portfolio / sample works");
  if (portfolioError) {
    errors.portfolio = portfolioError;
  } else if (input.portfolio.trim().length < MIN_PORTFOLIO_LENGTH) {
    errors.portfolio = `Portfolio must be at least ${MIN_PORTFOLIO_LENGTH} characters.`;
  }

  const privacyError = validatePrivacyPolicyAccepted(input.acceptedPrivacyPolicy);
  if (privacyError) errors.acceptedPrivacyPolicy = privacyError;

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

export function registerArtist(input: RegisterArtistInput): RegisterResult {
  const errors = validateRegisterArtistInput(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const stageName = input.stageName.trim();

  const user: User = {
    id: userId,
    email: input.email.trim().toLowerCase(),
    password: input.password,
    displayName: stageName,
    username: generateUsername(stageName),
    role: "artist",
    subscription: "basic",
    followerIds: [],
    followingUserIds: [],
    followingArtistIds: [],
    dailyStreamCount: 0,
    createdAt: now,
  };

  const artist: Artist = {
    id: crypto.randomUUID(),
    userId,
    stageName,
    portfolioUrl: input.portfolio.trim(),
    status: "pending",
    isVerified: false,
    totalListeners: 0,
    totalStreams: 0,
    createdAt: now,
  };

  addUser(user);
  addArtist(artist);
  addSubscription({
    id: crypto.randomUUID(),
    userId,
    tier: "basic",
    startDate: now,
    isActive: true,
  });

  return { success: true, user, artist };
}
