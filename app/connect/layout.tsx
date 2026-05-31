import nextDynamic from "next/dynamic";
import { ConnectProviders } from "../connect-providers";
import { PrivyOverlayFix } from "@/components/privy-overlay-fix";
import { PrivyPreload } from "@/components/privy-preload";
import "./connect.css";

const StarrySky = nextDynamic(
  () => import("@/components/starry-sky").then((m) => m.StarrySky),
  { ssr: false }
);

export const dynamic = "force-dynamic";

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConnectProviders>
      <StarrySky />
      <PrivyPreload />
      <PrivyOverlayFix />
      {children}
    </ConnectProviders>
  );
}
