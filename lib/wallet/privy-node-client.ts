import "server-only";

import { PrivyClient } from "@privy-io/node";

let client: PrivyClient | undefined;

export function getPrivyNodeClient(): PrivyClient {
  if (client) return client;

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
  const appSecret = process.env.PRIVY_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID or PRIVY_APP_SECRET");
  }

  client = new PrivyClient({ appId, appSecret });
  return client;
}
