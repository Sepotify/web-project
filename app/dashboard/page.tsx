import { Suspense } from "react";
import { DashboardIndexRedirect } from "@/components/dashboard/DashboardIndexRedirect";

export default function DashboardIndexPage() {
  return (
    <Suspense fallback={null}>
      <DashboardIndexRedirect />
    </Suspense>
  );
}
