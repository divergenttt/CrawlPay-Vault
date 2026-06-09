import { base, polygon } from "viem/chains";
import type { Chain } from "viem";

/** Supported CrawlPay settlement networks (EVM mainnet). */
export type CrawlPayNetworkId = "base" | "polygon";

export interface CrawlPayNetworkConfig {
  id: CrawlPayNetworkId;
  chainId: number;
  name: string;
  rpc: string;
  usdcAddress: `0x${string}`;
  /** Circle Gateway settlement supported on this network. */
  circleGateway: boolean;
  explorer: string;
  viemChain: Chain;
}

export const CRAWLPAY_NETWORKS: Record<CrawlPayNetworkId, CrawlPayNetworkConfig> = {
  base: {
    id: "base",
    chainId: 8453,
    name: "Base",
    rpc:
      process.env.NEXT_PUBLIC_RPC_BASE?.trim() ||
      process.env.NEXT_PUBLIC_RPC?.trim() ||
      "https://mainnet.base.org",
    usdcAddress: (process.env.NEXT_PUBLIC_USDC_BASE?.trim() ||
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as `0x${string}`,
    circleGateway: true,
    explorer: "https://basescan.org",
    viemChain: base,
  },
  polygon: {
    id: "polygon",
    chainId: 137,
    name: "Polygon",
    rpc:
      process.env.NEXT_PUBLIC_RPC_POLYGON?.trim() ||
      "https://polygon-bor.publicnode.com",
    usdcAddress: (process.env.NEXT_PUBLIC_USDC_POLYGON?.trim() ||
      "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359") as `0x${string}`,
    circleGateway: true,
    explorer: "https://polygonscan.com",
    viemChain: polygon,
  },
};

/** Primary RPC plus public fallbacks (deduped). Used when balance reads fail. */
export function getNetworkRpcUrls(id: CrawlPayNetworkId): string[] {
  const primary = CRAWLPAY_NETWORKS[id].rpc;
  const fallbacks: Record<CrawlPayNetworkId, string[]> = {
    base: ["https://mainnet.base.org", "https://base.publicnode.com"],
    polygon: [
      "https://polygon-bor.publicnode.com",
      "https://1rpc.io/matic",
      "https://polygon.drpc.org",
    ],
  };
  return [...new Set([primary, ...fallbacks[id]])];
}

export function isCrawlPayNetworkId(value: string | undefined | null): value is CrawlPayNetworkId {
  return value === "base" || value === "polygon";
}

/** Resolve network id from env or explicit value. Default: base. */
export function resolveNetworkId(value?: string | null): CrawlPayNetworkId {
  const raw = (value ?? process.env.CRAWLPAY_NETWORK ?? process.env.NEXT_PUBLIC_CRAWLPAY_NETWORK ?? "base")
    .trim()
    .toLowerCase();
  return raw === "polygon" ? "polygon" : "base";
}

export function getNetworkConfig(id?: string | null): CrawlPayNetworkConfig {
  return CRAWLPAY_NETWORKS[resolveNetworkId(id)];
}

export function getActiveNetworkConfig(): CrawlPayNetworkConfig {
  return getNetworkConfig();
}

/** EVM tx explorer link for the given network (falls back to active network). */
export function getNetworkExplorerTxUrl(
  txHash: string,
  networkId?: string | null
): string {
  if (!txHash?.trim()) return "";
  const normalized = txHash.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) return "";
  const { explorer } = getNetworkConfig(networkId);
  return `${explorer}/tx/${normalized}`;
}
