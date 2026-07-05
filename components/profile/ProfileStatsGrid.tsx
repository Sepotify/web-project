import { Card } from "@/components/ui/Card";
import { getFollowerCount, getFollowingCount } from "@/lib/profile";
import type { User } from "@/types";

interface ProfileStatsGridProps {
  user: User;
}

export function ProfileStatsGrid({ user }: ProfileStatsGridProps) {
  const stats = [
    { label: "Followers", value: getFollowerCount(user) },
    { label: "Following", value: getFollowingCount(user) },
    { label: "Daily streams", value: user.dailyStreamCount },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center">
          <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
          <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}
