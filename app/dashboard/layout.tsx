import nextDynamic from "next/dynamic";
import { ConnectProviders } from "../connect-providers";
import "./dashboard.css";

const DashboardAuthShell = nextDynamic(
  () =>
    import("@/components/dashboard/dashboard-auth-shell").then(
      (m) => m.DashboardAuthShell
    ),
  {
    ssr: false,
    loading: () => (
      <div className="db-shell flex min-h-[40vh] items-center justify-center text-zinc-500">
        Loading…
      </div>
    ),
  }
);

export const dynamic = "force-dynamic";

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
