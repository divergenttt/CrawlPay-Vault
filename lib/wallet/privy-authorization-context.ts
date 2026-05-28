import "server-only";

import type { AuthorizationContext } from "@privy-io/node";

export function getPrivyAuthorizationPrivateKey(): string {
  const key = process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing PRIVY_AUTHORIZATION_PRIVATE_KEY (required when CRAWLPAY_API_KEY_ONCHAIN=true)"
    );
  }
  return key;
}

export function getPrivyAuthorizationContext(): AuthorizationContext {
  return {
    authorization_private_keys: [getPrivyAuthorizationPrivateKey()],
  };
}
