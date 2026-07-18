import { getArtistById, getArtists, getUserById } from "@/lib/storage";
import type { Artist, User, UserRole } from "@/types";

export interface DashboardNavItem {
  href: string;
  label: string;
  roles: UserRole[];
  matchPrefix?: boolean;
}

export interface ArtistApplication {
  artist: Artist;
  user: User;
}

const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: "/dashboard/artists",
    label: "Artist approvals",
    roles: ["support", "admin"],
    matchPrefix: true,
  },
  {
    href: "/dashboard/tickets",
    label: "Support tickets",
    roles: ["support", "admin"],
    matchPrefix: true,
  },
  {
    href: "/dashboard/finance",
    label: "Financial audit",
    roles: ["admin"],
  },
  {
    href: "/dashboard/pricing",
    label: "Subscription pricing",
    roles: ["admin"],
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    roles: ["admin"],
  },
];

export function canAccessDashboard(role: UserRole | undefined): boolean {
  return role === "support" || role === "admin";
}

export function getDashboardNavItems(role: UserRole | undefined): DashboardNavItem[] {
  if (!role) return [];
  return DASHBOARD_NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function getPendingArtistApplications(): ArtistApplication[] {
  return getArtists()
    .filter((artist) => artist.status === "pending")
    .map((artist) => {
      const user = getUserById(artist.userId);
      if (!user) return null;
      return { artist, user };
    })
    .filter((entry): entry is ArtistApplication => Boolean(entry))
    .sort(
      (a, b) =>
        new Date(b.artist.createdAt).getTime() - new Date(a.artist.createdAt).getTime(),
    );
}

export function getArtistApplication(artistId: string): ArtistApplication | null {
  const artist = getArtistById(artistId);
  if (!artist) return null;

  const user = getUserById(artist.userId);
  if (!user) return null;

  return { artist, user };
}

export function formatDashboardDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
