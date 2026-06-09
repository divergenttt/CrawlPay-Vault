import {
  createPublicClient,
  erc20Abi,
  formatEther,
  formatUnits,
  http,
  type Address,
} from "viem";
import {
  getActiveNetworkConfig,
  getNetworkConfig,
  getNetworkRpcUrls,
  type CrawlPayNetworkId,
} from "@/lib/networks/chains";

function clientForRpc(rpc: string, networkId: CrawlPayNetworkId) {
  const config = getNetworkConfig(networkId);
  return createPublicClient({
    chain: config.viemChain,
    transport: http(rpc, {
      timeout: 25_000,
      retryCount: 1,
      retryDelay: 400,
    }),
  });
}

async function readBalanceOnce(
  walletAddress: string,
  networkId: CrawlPayNetworkId,
  rpc: string
): Promise<bigint> {
  const config = getNetworkConfig(networkId);
  const publicClient = clientForRpc(rpc, networkId);
  return publicClient.readContract({
    address: config.usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAddress as Address],
  });
}

async function readBalanceWithFallback(
  walletAddress: string,
  networkId: CrawlPayNetworkId
): Promise<bigint> {
  const rpcs = getNetworkRpcUrls(networkId);
  let lastError: unknown;

  for (const rpc of rpcs) {
    try {
      return await readBalanceOnce(walletAddress, networkId, rpc);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error(`All RPC endpoints failed for ${networkId}`);
}

export async function fetchArcUsdcBalance(
  walletAddress: string,
  networkId?: CrawlPayNetworkId | null
): Promise<number> {
  const id = networkId ?? getActiveNetworkConfig().id;
  try {
    const raw = await readBalanceWithFallback(walletAddress, id);
    return parseFloat(formatUnits(raw, 6));
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    const raw = await readBalanceWithFallback(walletAddress, id);
    return parseFloat(formatUnits(raw, 6));
  }
}

/** Network-aware USDC balance (Base or Polygon via `CRAWLPAY_NETWORKS`). */
export const getUSDCBalance = fetchArcUsdcBalance;

export function formatUsdcBalance(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  if (amount === 0) return "0.000";
  if (amount < 0.001) return amount.toFixed(6);
  return amount.toFixed(3);
}

async function readEthBalanceOnce(
  walletAddress: string,
  networkId: CrawlPayNetworkId,
  rpc: string
): Promise<bigint> {
  const publicClient = clientForRpc(rpc, networkId);
  return publicClient.getBalance({ address: walletAddress as Address });
}

async function readEthBalanceWithFallback(
  walletAddress: string,
  networkId: CrawlPayNetworkId
): Promise<bigint> {
  const rpcs = getNetworkRpcUrls(networkId);
  let lastError: unknown;

  for (const rpc of rpcs) {
    try {
      return await readEthBalanceOnce(walletAddress, networkId, rpc);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error(`All RPC endpoints failed for ${networkId}`);
}

export async function fetchNativeBalance(
  walletAddress: string,
  networkId?: CrawlPayNetworkId | null
): Promise<number> {
  const id = networkId ?? getActiveNetworkConfig().id;
  try {
    const raw = await readEthBalanceWithFallback(walletAddress, id);
    return parseFloat(formatEther(raw));
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    const raw = await readEthBalanceWithFallback(walletAddress, id);
    return parseFloat(formatEther(raw));
  }
}

/** @deprecated Use fetchNativeBalance — kept for Base-specific call sites. */
export async function fetchBaseEthBalance(
  walletAddress: string
): Promise<number> {
  return fetchNativeBalance(walletAddress, "base");
}

export function formatEthBalance(amountEth: number): string {
  if (!Number.isFinite(amountEth)) return "—";
  if (amountEth === 0) return "0";
  if (amountEth < 0.000_001) return amountEth.toFixed(7);
  if (amountEth < 0.0001) return amountEth.toFixed(6);
  if (amountEth < 0.01) return amountEth.toFixed(4);
  return amountEth.toFixed(3);
}
