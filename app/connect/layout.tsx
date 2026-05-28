import { ConnectProviders } from "../connect-providers";
import { PrivyOverlayFix } from "@/components/privy-overlay-fix";
import { PrivyPreload } from "@/components/privy-preload";
import "./connect.css";

export const dynamic = "force-dynamic";

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConnectProviders>
      <PrivyPreload />
      <PrivyOverlayFix />
      {children}
    </ConnectProviders>
  );
}
