import { ConnectProviders } from "../../connect-providers";

export default function DashboardConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConnectProviders>{children}</ConnectProviders>;
}
