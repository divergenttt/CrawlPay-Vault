import nextDynamic from "next/dynamic";
import "./dashboard.css";
import { PrivyOverlayFix } from "@/components/privy-overlay-fix";

const DashboardRootProviders = nextDynamic(
  () =>
    import("./dashboard-root-providers").then((m) => m.DashboardRootProviders),
  {
    ssr: false,
    loading: () => (
      <div className="db-shell flex min-h-[40vh] items-center justify-center text-zinc-500">
        Loading…
      </div>
    ),
  }
);

const StarrySky = nextDynamic(
  () => import("@/components/starry-sky").then((m) => m.StarrySky),
  { ssr: false }
);

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-page">
      <StarrySky />
      <PrivyOverlayFix />
      <DashboardRootProviders>{children}</DashboardRootProviders>
    </div>
  );
}
