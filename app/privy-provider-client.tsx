"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { base } from "viem/chains";
import { AuthUiProvider } from "@/lib/auth/auth-ui-context";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

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
        defaultChain: base,
        supportedChains: [base],
      }}
    >
      <AuthUiProvider>{children}</AuthUiProvider>
    </PrivyProvider>
  );
}
