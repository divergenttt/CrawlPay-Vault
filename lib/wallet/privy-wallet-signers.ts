import "server-only";

import { getPrivyNodeClient } from "./privy-node-client";
import { getPrivySignerQuorumId } from "./privy-signer-quorum-id";

export async function walletHasServerSigner(
  walletAddress: string
): Promise<boolean> {
  const quorumId = getPrivySignerQuorumId();
  if (!quorumId) return false;

  try {
    const privy = getPrivyNodeClient();
    const wallet = await privy.wallets().getWalletByAddress({
      address: walletAddress,
    });
    const signers = wallet.additional_signers ?? [];
    return signers.some((s) => s.signer_id === quorumId);
  } catch {
    return false;
  }
}

export function serverSignerNotConfiguredMessage(): string {
  return (
    "On-chain billing is not fully configured. Set PRIVY_SIGNER_QUORUM_ID and " +
    "PRIVY_AUTHORIZATION_PRIVATE_KEY on the server, then visit /connect/api-keys " +
    "while logged in and click Enable on-chain payments."
  );
}

export function walletMissingServerSignerMessage(): string {
  return (
    "Your wallet has not granted server signing permission yet. Open " +
    "https://crawl-pay.com/connect/api-keys while logged in and click " +
    '"Enable on-chain payments", then try again.'
  );
}
