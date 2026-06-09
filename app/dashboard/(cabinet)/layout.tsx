import { DashboardCabinetShell } from "@/components/dashboard/dashboard-cabinet-shell";

export default function DashboardCabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardCabinetShell>{children}</DashboardCabinetShell>;
}
