"use client";

import dynamic from "next/dynamic";
import { AuthUiStubProvider } from "@/lib/auth/auth-ui-context";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

const PrivyProviderClient = dynamic(
  () =>
    import("./privy-provider-client").then((m) => m.PrivyProviderClient),
  {
    ssr: false,
    loading: () => null,
  }
);

export function PrivyProviders({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    if (typeof window !== "undefined") {
      console.error(
        "[CrawlPay] NEXT_PUBLIC_PRIVY_APP_ID is missing — authentication is disabled."
      );
    }
    return <AuthUiStubProvider>{children}</AuthUiStubProvider>;
  }

  return <PrivyProviderClient>{children}</PrivyProviderClient>;
}
