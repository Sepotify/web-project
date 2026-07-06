"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function DashboardIndexRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const artistId = searchParams.get("artistId");

    if (artistId) {
      router.replace(`/dashboard/artists/${artistId}`);
      return;
    }

    router.replace("/dashboard/artists");
  }, [router, searchParams]);

  return null;
}
