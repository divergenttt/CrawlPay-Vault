"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { base, polygon } from "viem/chains";
import { AuthUiProvider } from "@/lib/auth/auth-ui-context";
import { RegisterPrivyServerSigner } from "@/components/wallet/register-privy-server-signer";
import { resolveNetworkId } from "@/lib/networks/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
const fundNetwork = resolveNetworkId(process.env.NEXT_PUBLIC_CRAWLPAY_NETWORK);
const defaultChain = fundNetwork === "polygon" ? polygon : base;
const supportedChains = fundNetwork === "polygon" ? [polygon, base] : [base, polygon];

export function PrivyProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
          walletList: [],
          showWalletLoginFirst: false,
        },
        loginMethods: ["google", "github", "telegram", "twitter"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain,
        supportedChains,
      }}
    >
      <RegisterPrivyServerSigner />
      <AuthUiProvider>{children}</AuthUiProvider>
    </PrivyProvider>
  );
}
