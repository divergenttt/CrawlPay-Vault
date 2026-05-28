import "server-only";

import {
  isEmbeddedWalletLinkedAccount,
  type LinkedAccount,
} from "@privy-io/node";
import { getPrivyNodeClient } from "./privy-node-client";

export type EmbeddedWalletRef = {
  address: string;
  walletId: string;
};

function isEthereumAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isPrivyWalletId(value: string): boolean {
  const trimmed = value.trim();
  return Boolean(trimmed) && !isEthereumAddress(trimmed);
}

function embeddedEthereumFromLinkedAccounts(
  accounts: LinkedAccount[]
): { address: string; walletId?: string } | null {
  for (const account of accounts) {
    if (!isEmbeddedWalletLinkedAccount(account)) continue;
    if (account.chain_type !== "ethereum") continue;

    const address = account.address?.trim();
    if (!address) continue;

    const linkedId = account.id?.trim();
    if (linkedId && isPrivyWalletId(linkedId)) {
      return { address, walletId: linkedId };
    }

    return { address };
  }

  return null;
}

async function resolveWalletIdByAddress(
  privyUserId: string,
  address: string
): Promise<string | null> {
  const privy = getPrivyNodeClient();
  const normalized = address.toLowerCase();

  for await (const wallet of privy.wallets().list({
    user_id: privyUserId,
    chain_type: "ethereum",
  })) {
    if (wallet.address?.toLowerCase() === normalized && isPrivyWalletId(wallet.id)) {
      return wallet.id;
    }
  }

  return null;
}

/** Resolve embedded wallet for a Privy user (address + Privy wallet id for signing). */
export async function fetchEmbeddedWalletForPrivyUser(
  privyUserId: string
): Promise<EmbeddedWalletRef | null> {
  try {
    const privy = getPrivyNodeClient();
    const user = await privy.users()._get(privyUserId);
    const match = embeddedEthereumFromLinkedAccounts(user.linked_accounts ?? []);
    if (!match) return null;

    const walletId =
      match.walletId ??
      (await resolveWalletIdByAddress(privyUserId, match.address));
    if (!walletId) return null;

    return { address: match.address, walletId };
  } catch (err) {
    console.error(
      "[CrawlPay] Privy embedded wallet lookup failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
