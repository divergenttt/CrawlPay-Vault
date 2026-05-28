"use client";

import dynamic from "next/dynamic";
import { AuthUiStubProvider } from "@/lib/auth/auth-ui-context";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

function PrivyBootLoading() {
  return (
    <div
      className="db-shell"
      style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--gray)",
        fontFamily: "var(--font-dm-sans, sans-serif)",
        fontSize: "14px",
      }}
    >
      Loading…
    </div>
  );
}

const PrivyProviderClient = dynamic(
  () =>
    import("./privy-provider-client").then((m) => m.PrivyProviderClient),
  {
    ssr: false,
    loading: () => <PrivyBootLoading />,
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
