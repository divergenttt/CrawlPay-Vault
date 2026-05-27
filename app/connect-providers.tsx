"use client";

import { PrivyProviders } from "./privy-providers";

/** Privy + auth UI — only mounted under /connect and /dashboard/connect layouts. */
export function ConnectProviders({ children }: { children: React.ReactNode }) {
  return <PrivyProviders>{children}</PrivyProviders>;
}
