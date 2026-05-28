import { ConnectProviders } from "../connect-providers";
import { PrivyOverlayFix } from "@/components/privy-overlay-fix";
import { PrivyPreload } from "@/components/privy-preload";

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
