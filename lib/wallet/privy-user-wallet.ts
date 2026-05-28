import "server-only";

import { getPrivyNodeClient } from "./privy-node-client";

export type EmbeddedWalletRef = {
  address: string;
  walletId: string;
};

type LinkedWalletAccount = {
  type?: string;
  address?: string;
  id?: string | null;
  wallet_client_type?: string;
  walletClientType?: string;
};

function isPrivyWalletId(id: string): boolean {
  return Boolean(id.trim()) && !/^0x[a-fA-F0-9]{40}$/.test(id);
}

export async function fetchEmbeddedWalletForPrivyUser(
  privyUserId: string,
  _options?: { hintAddress?: string; hintWalletId?: string }
): Promise<EmbeddedWalletRef | null> {
  try {
    const privy = getPrivyNodeClient();
    const user = await privy.users()._get(privyUserId);

    console.log(
      "[CrawlPay] linked_accounts:",
      JSON.stringify(user.linked_accounts)
    );

    const wallet = user.linked_accounts?.find((account) => {
      const row = account as LinkedWalletAccount;
      if (row.type !== "wallet") return false;
      const client = row.wallet_client_type ?? row.walletClientType;
      return client === "privy";
    }) as LinkedWalletAccount | undefined;

    if (!wallet?.address) return null;

    console.log("[CrawlPay] wallet found:", wallet.address, wallet.id);

    if (!wallet.id || !isPrivyWalletId(wallet.id)) return null;

    return { address: wallet.address, walletId: wallet.id };
  } catch (err) {
    console.error("[CrawlPay] wallet lookup failed:", err);
    return null;
  }
}

export async function fetchEmbeddedWalletFromIdentityToken(
  _identityToken: string,
  _options?: { hintAddress?: string; hintWalletId?: string }
): Promise<EmbeddedWalletRef | null> {
  return null;
}

export function privyCredentialsMisconfigured(): boolean {
  return !process.env.PRIVY_APP_SECRET?.trim();
}
