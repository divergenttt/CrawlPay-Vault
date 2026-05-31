import nextDynamic from "next/dynamic";
import "./dashboard.css";

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
      {children}
    </div>
  );
}
