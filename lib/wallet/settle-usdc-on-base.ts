import "server-only";

import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import {
  getNetworkConfig,
  type CrawlPayNetworkId,
} from "@/lib/networks/chains";
import {
  getDefaultSettlementNetworkId,
  resolveSettlementNetwork,
  type SettlementNetworkContext,
} from "@/lib/networks/resolve-settlement";
import { getPrivyNodeClient } from "./privy-node-client";
import { getPrivyAuthorizationContext } from "./privy-authorization-context";

export function isApiKeyOnchainEnabled(): boolean {
  const flag = process.env.CRAWLPAY_API_KEY_ONCHAIN?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export async function settleUsdcFromEmbeddedWallet(params: {
  walletId: string;
  recipient: string;
  amountUsdc: number;
  networkId?: CrawlPayNetworkId;
}): Promise<{ txHash: string }> {
  const network = getNetworkConfig(params.networkId);
  const seller = params.recipient.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(seller)) {
    throw new Error("Invalid seller address for settlement");
  }

  const amount = parseUnits(params.amountUsdc.toFixed(6), 6);
  if (amount <= 0n) {
    throw new Error("Settlement amount must be positive");
  }

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [seller as `0x${string}`, amount],
  });

  const privy = getPrivyNodeClient();
  const response = await privy.wallets().ethereum().sendTransaction(params.walletId, {
    authorization_context: getPrivyAuthorizationContext(),
    caip2: `eip155:${network.chainId}`,
    params: {
      transaction: {
        to: network.usdcAddress,
        data,
        chain_id: network.chainId,
      },
    },
  });

  const txHash = response.hash;
  if (!txHash) {
    throw new Error("Privy did not return a transaction hash");
  }

  return { txHash };
}

/** Active settlement network (env default; pass context for header / user preference). */
export function getSettlementNetworkId(
  context?: SettlementNetworkContext
): CrawlPayNetworkId {
  if (context && Object.keys(context).length > 0) {
    return resolveSettlementNetwork(context);
  }
  return getDefaultSettlementNetworkId();
}
