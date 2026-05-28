import "server-only";

import {
  AuthenticationError,
  isEmbeddedWalletLinkedAccount,
  type LinkedAccount,
} from "@privy-io/node";
import { getPrivyNodeClient } from "./privy-node-client";

export type EmbeddedWalletRef = {
  address: string;
  walletId: string;
};

export type FetchEmbeddedWalletOptions = {
  /** Address from the client session (useWallets / linkedAccounts). */
  hintAddress?: string;
  /** Optional Privy wallet id from the client linked account. */
  hintWalletId?: string;
};

function isEthereumAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isPrivyWalletId(value: string): boolean {
  const trimmed = value.trim();
  return Boolean(trimmed) && !isEthereumAddress(trimmed);
}

function privyUserIdCandidates(privyUserId: string): string[] {
  const trimmed = privyUserId.trim();
  const out = new Set<string>([trimmed]);
  if (trimmed.startsWith("did:privy:")) {
    out.add(trimmed.slice("did:privy:".length));
  } else {
    out.add(`did:privy:${trimmed}`);
  }
  return [...out];
}

function isPrivyManagedEthereumWallet(account: LinkedAccount): boolean {
  if (account.type !== "wallet") return false;

  const record = account as LinkedAccount & {
    wallet_client?: string;
    wallet_client_type?: string;
    connector_type?: string;
    chain_type?: string;
    address?: string;
    id?: string | null;
  };

  const client =
    record.wallet_client_type ?? record.wallet_client ?? "";
  if (client !== "privy") return false;

  const address = record.address?.trim();
  if (!address || !isEthereumAddress(address)) return false;

  if (record.chain_type && record.chain_type !== "ethereum") return false;

  if (isEmbeddedWalletLinkedAccount(account)) return true;

  const connector = record.connector_type;
  return !connector || connector === "embedded";
}

function embeddedEthereumFromLinkedAccounts(
  accounts: LinkedAccount[]
): { address: string; walletId?: string } | null {
  for (const account of accounts) {
    if (!isPrivyManagedEthereumWallet(account)) continue;

    const walletAccount = account as LinkedAccount & {
      address?: string;
      id?: string | null;
    };
    const address = walletAccount.address?.trim();
    if (!address) continue;

    const linkedId = walletAccount.id?.trim();
    if (linkedId && isPrivyWalletId(linkedId)) {
      return { address, walletId: linkedId };
    }

    return { address };
  }

  return null;
}

function finalizeWalletRef(
  match: { address: string; walletId?: string },
  options?: FetchEmbeddedWalletOptions
): EmbeddedWalletRef | null {
  const hintId = options?.hintWalletId?.trim();
  const walletId =
    (match.walletId && isPrivyWalletId(match.walletId) ? match.walletId : null) ??
    (hintId && isPrivyWalletId(hintId) ? hintId : null);

  if (!walletId) return null;

  const hintAddress = options?.hintAddress?.trim();
  if (
    hintAddress &&
    hintAddress.toLowerCase() !== match.address.toLowerCase()
  ) {
    return null;
  }

  return { address: match.address, walletId };
}

/** Resolve wallet from Privy identity token (JWKS only — works without valid app secret). */
export async function fetchEmbeddedWalletFromIdentityToken(
  identityToken: string,
  options?: FetchEmbeddedWalletOptions
): Promise<EmbeddedWalletRef | null> {
  try {
    const privy = getPrivyNodeClient();
    const user = await privy.users().get({ id_token: identityToken });
    const match = embeddedEthereumFromLinkedAccounts(user.linked_accounts ?? []);
    if (!match) return null;
    return finalizeWalletRef(match, options);
  } catch (err) {
    console.error(
      "[CrawlPay] Privy identity token wallet lookup failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function fetchPrivyUser(privyUserId: string) {
  const privy = getPrivyNodeClient();
  let lastError: unknown;

  for (const id of privyUserIdCandidates(privyUserId)) {
    try {
      return await privy.users()._get(id);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error("Privy user not found");
}

async function userOwnsAddress(
  privyUserId: string,
  address: string
): Promise<boolean> {
  const privy = getPrivyNodeClient();
  try {
    const owner = await privy.users().getByWalletAddress({ address });
    const expected = new Set(privyUserIdCandidates(privyUserId));
    return expected.has(owner.id);
  } catch {
    return false;
  }
}

async function resolveWalletByAddress(
  address: string
): Promise<EmbeddedWalletRef | null> {
  const privy = getPrivyNodeClient();
  try {
    const wallet = await privy.wallets().getWalletByAddress({ address });
    if (
      wallet.address &&
      wallet.id &&
      isPrivyWalletId(wallet.id) &&
      wallet.chain_type === "ethereum"
    ) {
      return { address: wallet.address, walletId: wallet.id };
    }
  } catch {
    // fall through
  }
  return null;
}

async function resolveWalletIdByUser(
  privyUserId: string,
  address: string
): Promise<string | null> {
  const privy = getPrivyNodeClient();
  const normalized = address.toLowerCase();

  for (const userId of privyUserIdCandidates(privyUserId)) {
    try {
      for await (const wallet of privy.wallets().list({
        user_id: userId,
        chain_type: "ethereum",
      })) {
        if (
          wallet.address?.toLowerCase() === normalized &&
          isPrivyWalletId(wallet.id)
        ) {
          return wallet.id;
        }
      }
    } catch {
      // try next id format
    }
  }

  return null;
}

async function addressBelongsToUser(
  privyUserId: string,
  address: string
): Promise<boolean> {
  if (await userOwnsAddress(privyUserId, address)) return true;

  try {
    const user = await fetchPrivyUser(privyUserId);
    const linked = embeddedEthereumFromLinkedAccounts(user.linked_accounts ?? []);
    return linked?.address.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

async function resolveFromHint(
  privyUserId: string,
  hintAddress: string,
  options?: FetchEmbeddedWalletOptions
): Promise<EmbeddedWalletRef | null> {
  const address = hintAddress.trim();
  if (!isEthereumAddress(address)) return null;

  if (!(await addressBelongsToUser(privyUserId, address))) {
    return null;
  }

  const byAddress = await resolveWalletByAddress(address);
  if (byAddress) return byAddress;

  const walletId = await resolveWalletIdByUser(privyUserId, address);
  if (walletId) return { address, walletId };

  if (options?.hintWalletId && isPrivyWalletId(options.hintWalletId)) {
    return { address, walletId: options.hintWalletId };
  }

  return null;
}

function isPrivyAuthError(err: unknown): boolean {
  return err instanceof AuthenticationError;
}

/** Resolve embedded wallet for a Privy user (address + Privy wallet id for signing). */
export async function fetchEmbeddedWalletForPrivyUser(
  privyUserId: string,
  options?: FetchEmbeddedWalletOptions
): Promise<EmbeddedWalletRef | null> {
  const hint = options?.hintAddress?.trim();

  try {
    if (hint) {
      const fromHint = await resolveFromHint(privyUserId, hint, options);
      if (fromHint) return fromHint;
    }

    const user = await fetchPrivyUser(privyUserId);
    const match = embeddedEthereumFromLinkedAccounts(user.linked_accounts ?? []);
    if (!match) {
      if (hint && isEthereumAddress(hint)) {
        return resolveWalletByAddress(hint);
      }
      return null;
    }

    const walletId =
      match.walletId ??
      (options?.hintWalletId && isPrivyWalletId(options.hintWalletId)
        ? options.hintWalletId
        : undefined) ??
      (await resolveWalletIdByUser(privyUserId, match.address)) ??
      (await resolveWalletByAddress(match.address))?.walletId;

    if (!walletId) return null;

    return { address: match.address, walletId };
  } catch (err) {
    if (isPrivyAuthError(err)) {
      console.error(
        "[CrawlPay] Privy API rejected app credentials (401). Fix PRIVY_APP_SECRET in .env.local — copy a fresh secret from dashboard.privy.io for app",
        process.env.NEXT_PUBLIC_PRIVY_APP_ID
      );
    } else {
      console.error(
        "[CrawlPay] Privy embedded wallet lookup failed:",
        err instanceof Error ? err.message : err
      );
    }
    return null;
  }
}

export function privyCredentialsMisconfigured(): boolean {
  return !process.env.PRIVY_APP_SECRET?.trim();
}
