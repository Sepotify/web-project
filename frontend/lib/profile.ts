import { getUserById, mutateUsers, updateUser } from "@/lib/storage";
import { MIN_NAME_LENGTH, validateRequired } from "@/lib/validation";
import type { SubscriptionTier, User } from "@/types";

export const SUBSCRIPTION_LABELS: Record<SubscriptionTier, string> = {
  basic: "Basic",
  silver: "Silver",
  gold: "Gold",
};

export function canChangeAvatar(subscription: SubscriptionTier): boolean {
  return subscription !== "basic";
}

export function isFollowingUser(followerId: string, targetUserId: string): boolean {
  const follower = getUserById(followerId);
  return follower?.followingUserIds.includes(targetUserId) ?? false;
}

export function followUser(followerId: string, targetUserId: string): boolean {
  if (followerId === targetUserId) return false;

  const follower = getUserById(followerId);
  const target = getUserById(targetUserId);
  if (!follower || !target) return false;
  if (follower.followingUserIds.includes(targetUserId)) return false;

  mutateUsers((users) =>
    users.map((user) => {
      if (user.id === followerId) {
        return {
          ...user,
          followingUserIds: [...user.followingUserIds, targetUserId],
        };
      }
      if (user.id === targetUserId) {
        return {
          ...user,
          followerIds: [...user.followerIds, followerId],
        };
      }
      return user;
    }),
  );

  return true;
}

export function unfollowUser(followerId: string, targetUserId: string): boolean {
  if (followerId === targetUserId) return false;

  const follower = getUserById(followerId);
  const target = getUserById(targetUserId);
  if (!follower || !target) return false;
  if (!follower.followingUserIds.includes(targetUserId)) return false;

  mutateUsers((users) =>
    users.map((user) => {
      if (user.id === followerId) {
        return {
          ...user,
          followingUserIds: user.followingUserIds.filter((id) => id !== targetUserId),
        };
      }
      if (user.id === targetUserId) {
        return {
          ...user,
          followerIds: user.followerIds.filter((id) => id !== followerId),
        };
      }
      return user;
    }),
  );

  return true;
}

export interface UpdateProfileInput {
  displayName: string;
  avatarUrl?: string | null;
  avatarFile?: File | null;
}

export interface UpdateProfileErrors {
  displayName?: string;
  avatarUrl?: string;
}

export interface UpdateProfileResult {
  success: boolean;
  user?: User;
  errors?: UpdateProfileErrors;
  error?: string;
}

export function validateUpdateProfileInput(
  input: UpdateProfileInput,
  subscription: SubscriptionTier,
): UpdateProfileErrors {
  const errors: UpdateProfileErrors = {};

  const displayNameError = validateRequired(input.displayName, "Display name");
  if (displayNameError) {
    errors.displayName = displayNameError;
  } else if (input.displayName.trim().length < MIN_NAME_LENGTH) {
    errors.displayName = `Display name must be at least ${MIN_NAME_LENGTH} characters.`;
  }

  if (input.avatarUrl && !canChangeAvatar(subscription)) {
    errors.avatarUrl = "Basic plan users cannot change their profile photo.";
  }

  return errors;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const user = getUserById(userId);
  if (user) {
    const errors = validateUpdateProfileInput(input, user.subscription);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }
  }

  try {
    const { apiUpdateMe, mapApiUserToUser } = await import("@/lib/api/endpoints");
    let data;
    if (input.avatarFile) {
      const formData = new FormData();
      formData.append("display_name", input.displayName.trim());
      formData.append("avatar", input.avatarFile);
      data = await apiUpdateMe(formData);
    } else {
      data = await apiUpdateMe({ display_name: input.displayName.trim() });
    }
    return { success: true, user: mapApiUserToUser(data) };
  } catch {
    if (!user) {
      return { success: false, error: "Could not update profile." };
    }
  }

  const patch: Partial<User> = {
    displayName: input.displayName.trim(),
  };

  if (input.avatarUrl !== undefined) {
    if (input.avatarUrl === null) {
      patch.avatarUrl = undefined;
    } else if (canChangeAvatar(user.subscription)) {
      patch.avatarUrl = input.avatarUrl;
    }
  }

  updateUser(userId, patch);
  return { success: true, user: getUserById(userId) };
}

export function getFollowingCount(user: User): number {
  return user.followingCount ?? user.followingUserIds.length;
}

export function getFollowerCount(user: User): number {
  return user.followerCount ?? user.followerIds.length;
}
