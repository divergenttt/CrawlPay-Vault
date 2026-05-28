import "server-only";

import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { base } from "viem/chains";
import { getPrivyNodeClient } from "./privy-node-client";
import { getPrivyAuthorizationContext } from "./privy-authorization-context";

const USDC_BASE = (process.env.NEXT_PUBLIC_USDC_BASE?.trim() ||
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as `0x${string}`;

const FUND_CHAIN_ID = Number(process.env.NEXT_PUBLIC_FUND_CHAIN_ID || base.id);

export function isApiKeyOnchainEnabled(): boolean {
  const flag = process.env.CRAWLPAY_API_KEY_ONCHAIN?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export async function settleUsdcFromEmbeddedWallet(params: {
  walletId: string;
  recipient: string;
  amountUsdc: number;
}): Promise<{ txHash: string }> {
  if (FUND_CHAIN_ID !== base.id) {
    throw new Error("On-chain API key settlement requires Base mainnet (8453)");
  }

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
    caip2: "eip155:8453",
    params: {
      transaction: {
        to: USDC_BASE,
        data,
        chain_id: base.id,
      },
    },
  });

  const txHash = response.hash;
  if (!txHash) {
    throw new Error("Privy did not return a transaction hash");
  }

  return { txHash };
}