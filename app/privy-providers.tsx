"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { base, baseSepolia } from "viem/chains";
import { AuthUiProvider } from "@/lib/auth/auth-ui-context";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function PrivyProviders({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    console.error(
      "[CrawlPay] NEXT_PUBLIC_PRIVY_APP_ID is missing — authentication is disabled."
    );
    return <>{children}</>;
  }

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
            createOnLogin: "off",
          },
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia, base],
      }}
    >
      <AuthUiProvider>{children}</AuthUiProvider>
    </PrivyProvider>
  );
}
