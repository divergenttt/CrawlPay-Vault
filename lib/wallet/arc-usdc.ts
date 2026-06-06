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
  type CrawlPayNetworkId,
} from "@/lib/networks/chains";

function clientForNetwork(networkId?: CrawlPayNetworkId | null) {
  const config = getNetworkConfig(networkId);
  return createPublicClient({
    chain: config.viemChain,
    transport: http(config.rpc, {
      timeout: 25_000,
      retryCount: 2,
      retryDelay: 500,
    }),
  });
}

async function readBalanceOnce(
  walletAddress: string,
  networkId?: CrawlPayNetworkId | null
): Promise<bigint> {
  const config = getNetworkConfig(networkId);
  const publicClient = clientForNetwork(networkId);
  return publicClient.readContract({
    address: config.usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAddress as Address],
  });
}

export async function fetchArcUsdcBalance(
  walletAddress: string,
  networkId?: CrawlPayNetworkId | null
): Promise<number> {
  const id = networkId ?? getActiveNetworkConfig().id;
  try {
    const raw = await readBalanceOnce(walletAddress, id);
    return parseFloat(formatUnits(raw, 6));
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    const raw = await readBalanceOnce(walletAddress, id);
    return parseFloat(formatUnits(raw, 6));
  }
}

export function formatUsdcBalance(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  if (amount === 0) return "0.000";
  if (amount < 0.001) return amount.toFixed(6);
  return amount.toFixed(3);
}

async function readEthBalanceOnce(
  walletAddress: string,
  networkId?: CrawlPayNetworkId | null
): Promise<bigint> {
  const publicClient = clientForNetwork(networkId);
  return publicClient.getBalance({ address: walletAddress as Address });
}

export async function fetchNativeBalance(
  walletAddress: string,
  networkId?: CrawlPayNetworkId | null
): Promise<number> {
  const id = networkId ?? getActiveNetworkConfig().id;
  try {
    const raw = await readEthBalanceOnce(walletAddress, id);
    return parseFloat(formatEther(raw));
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    const raw = await readEthBalanceOnce(walletAddress, id);
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
