import "server-only";

import { getPrivySignerQuorumId } from "./privy-signer-quorum-id";

export function hasPrivyAuthorizationPrivateKey(): boolean {
  return Boolean(process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY?.trim());
}

export function isPrivyOnchainServerConfigured(): boolean {
  return Boolean(getPrivySignerQuorumId() && hasPrivyAuthorizationPrivateKey());
}

export function privyOnchainConfigError(): string | null {
  const missing: string[] = [];
  if (!getPrivySignerQuorumId()) {
    missing.push("PRIVY_SIGNER_QUORUM_ID (or NEXT_PUBLIC_PRIVY_SIGNER_QUORUM_ID)");
  }
  if (!hasPrivyAuthorizationPrivateKey()) {
    missing.push("PRIVY_AUTHORIZATION_PRIVATE_KEY");
  }
  if (missing.length === 0) return null;
  return `On-chain billing is missing server env: ${missing.join(", ")}. Add them in Vercel → Settings → Environment Variables, redeploy, then visit /connect/api-keys and click Enable on-chain payments.`;
}
