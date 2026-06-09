import "server-only";



import type { ApiKeyRow } from "@/lib/db/api-keys";

import { findApiKeyByToken, updateApiKeyWallet } from "@/lib/db/api-keys";

import { getApiKeyDailySpent, recordApiKeyUsage } from "@/lib/db/api-key-usage";

import { getApiKeyTokenFromRequest } from "@/lib/auth/api-key-request";

import { getOrCreateGlobalSettings } from "@/lib/db/user-settings";

import { getUSDCBalance } from "@/lib/wallet/arc-usdc";

import { fetchEmbeddedWalletForPrivyUser } from "@/lib/wallet/privy-user-wallet";

import {

  isApiKeyOnchainEnabled,

  settleUsdcFromEmbeddedWallet,

} from "@/lib/wallet/settle-usdc-on-base";

import { getNetworkConfig, type CrawlPayNetworkId } from "@/lib/networks/chains";

import {

  getNetworkHeaderFromRequest,

  parseNetworkPreference,

  resolveSettlementNetworks,

} from "@/lib/networks/resolve-settlement";

import {

  privyOnchainConfigError,

} from "@/lib/wallet/privy-onchain-config";

import {

  walletHasServerSigner,

  walletMissingServerSignerMessage,

} from "@/lib/wallet/privy-wallet-signers";

import type { NextRequest } from "next/server";



export type ApiKeyAccessResult =

  | {

      ok: true;

      key: ApiKeyRow;

      walletAddress: string;

      privyWalletId?: string;

      networkId: CrawlPayNetworkId;

    }

  | { ok: false; status: number; error: string };



async function ensureKeyWallet(key: ApiKeyRow): Promise<ApiKeyRow> {

  const address = key.owner_wallet_address?.trim();

  const walletId = key.privy_wallet_id?.trim();

  if (address && walletId) return key;



  const wallet = await fetchEmbeddedWalletForPrivyUser(key.privy_user_id, {

    hintAddress: address,

  });

  if (!wallet) {

    throw new Error(

      "No embedded wallet linked to this account. Sign in and create a wallet before using API keys."

    );

  }



  await updateApiKeyWallet(key.id, wallet);

  return {

    ...key,

    owner_wallet_address: wallet.address,

    privy_wallet_id: wallet.walletId,

  };

}



async function readUsdcBalance(

  walletAddress: string,

  networkId: CrawlPayNetworkId

): Promise<number | null> {

  try {

    return await getUSDCBalance(walletAddress, networkId);

  } catch {

    return null;

  }

}



type NetworkPickResult =

  | { ok: true; networkId: CrawlPayNetworkId }

  | { ok: false; status: number; error: string };



async function checkBalanceOnNetwork(
  walletAddress: string,
  amountUsdc: number,
  networkId: CrawlPayNetworkId
): Promise<NetworkPickResult> {
  const balance = await readUsdcBalance(walletAddress, networkId);
  const networkName = getNetworkConfig(networkId).name;
  if (balance === null) {
    return {
      ok: false,
      status: 503,
      error: `Could not verify USDC balance on ${networkName}. Try again shortly.`,
    };
  }
  if (balance < amountUsdc) {
    return {
      ok: false,
      status: 402,
      error: `Insufficient USDC on ${networkName} (${balance.toFixed(3)})`,
    };
  }
  return { ok: true, networkId };
}

async function pickSettlementNetwork(
  walletAddress: string,
  amountUsdc: number,
  networks: CrawlPayNetworkId[],
  headerNetwork: CrawlPayNetworkId | null
): Promise<NetworkPickResult> {
  // Header > userSettings > env (networks already resolved from preference)
  if (headerNetwork) {
    return checkBalanceOnNetwork(walletAddress, amountUsdc, headerNetwork);
  }

  if (networks.length === 1) {
    return checkBalanceOnNetwork(walletAddress, amountUsdc, networks[0]);
  }



  const entries = await Promise.all(

    networks.map(async (networkId) => ({

      networkId,

      balance: await readUsdcBalance(walletAddress, networkId),

    }))

  );



  if (entries.some((e) => e.balance === null)) {

    return {

      ok: false,

      status: 503,

      error: "Could not verify USDC balance on Base or Polygon. Try again shortly.",

    };

  }



  for (const { networkId, balance } of entries) {

    if (balance! >= amountUsdc) {

      return { ok: true, networkId };

    }

  }



  const baseBalance =

    entries.find((e) => e.networkId === "base")?.balance ?? 0;

  const polygonBalance =

    entries.find((e) => e.networkId === "polygon")?.balance ?? 0;



  return {

    ok: false,

    status: 402,

    error: `Insufficient USDC on Base (${baseBalance.toFixed(3)}) and Polygon (${polygonBalance.toFixed(3)})`,

  };

}



export async function authorizeApiKeyForAmount(

  req: NextRequest,

  amountUsdc: number

): Promise<ApiKeyAccessResult> {

  const token = getApiKeyTokenFromRequest(req);

  if (!token) {

    return {

      ok: false,

      status: 401,

      error: "Missing API key (Bearer cr_live_… or X-CrawlPay-Api-Key)",

    };

  }



  let key: ApiKeyRow | null;

  try {

    key = await findApiKeyByToken(token);

  } catch (err) {

    return {

      ok: false,

      status: 500,

      error: err instanceof Error ? err.message : "API key lookup failed",

    };

  }



  if (!key) {

    return { ok: false, status: 401, error: "Invalid API key" };

  }



  if (key.status !== "active") {

    return { ok: false, status: 403, error: `API key is ${key.status}` };

  }



  const perReq = Number(key.per_req_usdc);

  const daily = Number(key.daily_usdc);



  if (amountUsdc > perReq) {

    return {

      ok: false,

      status: 402,

      error: `Request amount ${amountUsdc} USDC exceeds per-request limit ${perReq} USDC for key "${key.name}"`,

    };

  }



  const spentToday = await getApiKeyDailySpent(key.id);

  if (spentToday + amountUsdc > daily) {

    return {

      ok: false,

      status: 429,

      error: `Daily limit exceeded (${spentToday.toFixed(3)} / ${daily} USDC spent today)`,

    };

  }



  try {

    key = await ensureKeyWallet(key);

  } catch (err) {

    return {

      ok: false,

      status: 402,

      error: err instanceof Error ? err.message : "Wallet not available",

    };

  }



  const walletAddress = key.owner_wallet_address!.trim();



  let preference = parseNetworkPreference("base");

  try {

    const settings = await getOrCreateGlobalSettings(

      key.privy_user_id,

      walletAddress

    );

    preference = parseNetworkPreference(settings.network ?? "base");

  } catch {

    preference = parseNetworkPreference("base");

  }



  const networks = resolveSettlementNetworks(preference);

  const headerNetwork = getNetworkHeaderFromRequest(req);



  const picked = await pickSettlementNetwork(

    walletAddress,

    amountUsdc,

    networks,

    headerNetwork

  );



  if (!picked.ok) {

    return { ok: false, status: picked.status, error: picked.error };

  }



  return {

    ok: true,

    key,

    walletAddress,

    privyWalletId: key.privy_wallet_id?.trim() || undefined,

    networkId: picked.networkId,

  };

}



export type ApiKeySettlement = {

  txHash: string;

  mode: "onchain" | "ledger";

};



export async function settleApiKeyPayment(

  access: Extract<ApiKeyAccessResult, { ok: true }>,

  amountUsdc: number

): Promise<ApiKeySettlement> {

  const seller =

    process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim() ||

    process.env.SELLER_ADDRESS?.trim();



  const walletId = access.privyWalletId;

  if (isApiKeyOnchainEnabled() && walletId && seller) {

    const configError = privyOnchainConfigError();

    if (configError) {

      throw new Error(configError);

    }



    const hasSigner = await walletHasServerSigner(access.walletAddress);

    if (!hasSigner) {

      throw new Error(walletMissingServerSignerMessage());

    }



    try {

      const { txHash } = await settleUsdcFromEmbeddedWallet({

        walletId,

        recipient: seller,

        amountUsdc,

        networkId: access.networkId,

      });

      await recordApiKeyUsage(access.key.id, amountUsdc);

      return { txHash, mode: "onchain" };

    } catch (err) {

      console.error("[CrawlPay] On-chain API key settlement failed:", err);

      const message = formatOnchainSettlementError(err);

      throw new Error(message);

    }

  }



  await recordApiKeyUsage(access.key.id, amountUsdc);

  return {

    txHash: apiKeyTxHash(access.key.id),

    mode: "ledger",

  };

}



export function apiKeyTxHash(keyId: string): string {

  return `apikey_${keyId.replace(/-/g, "").slice(0, 16)}_${Date.now().toString(36)}`;

}



function formatOnchainSettlementError(err: unknown): string {

  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes("No valid authorization keys or user signing keys")) {

    return walletMissingServerSignerMessage();

  }

  if (raw.includes("Missing PRIVY_AUTHORIZATION_PRIVATE_KEY")) {

    return (

      privyOnchainConfigError() ??

      "Missing PRIVY_AUTHORIZATION_PRIVATE_KEY on the server."

    );

  }

  return raw;

}


