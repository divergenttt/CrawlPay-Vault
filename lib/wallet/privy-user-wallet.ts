import "server-only";

export type EmbeddedWalletRef = {
  address: string;
  walletId: string;
};

type LinkedAccount = {
  type?: string;
  address?: string;
  id?: string;
  wallet_client_type?: string;
  connector_type?: string;
};

/** Resolve embedded wallet for a Privy user via REST (server has no id_token). */
export async function fetchEmbeddedWalletForPrivyUser(
  privyUserId: string
): Promise<EmbeddedWalletRef | null> {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
  const appSecret = process.env.PRIVY_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;

  const auth = Buffer.from(`${appId}:${appSecret}`).toString("base64");
  const res = await fetch(`https://api.privy.io/v1/users/${privyUserId}`, {
    headers: {
      Authorization: `Basic ${auth}`,
      "privy-app-id": appId,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(
      "[CrawlPay] Privy user lookup failed:",
      res.status,
      await res.text().catch(() => "")
    );
    return null;
  }

  const user = (await res.json()) as { linked_accounts?: LinkedAccount[] };
  const accounts = user.linked_accounts ?? [];

  for (const account of accounts) {
    if (
      account.type === "wallet" &&
      account.wallet_client_type === "privy" &&
      account.address &&
      account.id
    ) {
      return { address: account.address, walletId: account.id };
    }
  }

  return null;
}
