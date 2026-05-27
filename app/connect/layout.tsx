import { ConnectProviders } from "../connect-providers";
import { PrivyPreload } from "@/components/privy-preload";

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConnectProviders>
      <PrivyPreload />
      {children}
    </ConnectProviders>
  );
}
