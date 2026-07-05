"use client";

import { useEffect } from "react";
import { MOCK_SEED_DATA } from "@/lib/seed-data";
import { getUsers, seedStorage } from "@/lib/storage";

export function StorageSeed({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (getUsers().length === 0) {
      seedStorage(MOCK_SEED_DATA);
    }
  }, []);

  return children;
}
