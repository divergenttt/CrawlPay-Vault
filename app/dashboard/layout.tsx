import { ConnectProviders } from "../connect-providers";
import { DashboardAuthShell } from "@/components/dashboard/dashboard-auth-shell";
import "./dashboard.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConnectProviders>
      <div className="dashboard-page">
        <DashboardAuthShell>{children}</DashboardAuthShell>
      </div>
    </ConnectProviders>
  );
}
