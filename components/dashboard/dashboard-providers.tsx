"use client";

import { ConnectProviders } from "@/app/connect-providers";
import { DashboardAuthShell } from "@/components/dashboard/dashboard-auth-shell";

export function DashboardProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConnectProviders>
      <DashboardAuthShell>{children}</DashboardAuthShell>
    </ConnectProviders>
  );
}
