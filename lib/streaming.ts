import { getAuthSession, getUserById, updateUser } from "@/lib/storage";

export function incrementDailyStreamCount(userId?: string): void {
  const resolvedUserId = userId ?? getAuthSession()?.userId;
  if (!resolvedUserId) return;

  const user = getUserById(resolvedUserId);
  if (!user) return;

  updateUser(resolvedUserId, {
    dailyStreamCount: user.dailyStreamCount + 1,
  });
}
