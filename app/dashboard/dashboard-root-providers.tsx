"use client";

import { DashboardProviders } from "@/components/dashboard/dashboard-providers";
import { useCursor } from "@/lib/hooks";

export function DashboardRootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useCursor();

  return (
    <>
      <div className="cursor-ring" aria-hidden />
      <div className="cursor-dot" aria-hidden />
      <DashboardProviders>{children}</DashboardProviders>
    </>
  );
}
