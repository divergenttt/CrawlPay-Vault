export const dynamic = "force-dynamic";

/** Privy providers come from parent app/dashboard/layout.tsx */
export default function DashboardConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
