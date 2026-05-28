import { ConnectProviders } from "../../connect-providers";

export const dynamic = "force-dynamic";

export default function DashboardConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConnectProviders>{children}</ConnectProviders>;
}
