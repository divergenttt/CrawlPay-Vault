import {
  createPublicClient,
  erc20Abi,
  formatEther,
  formatUnits,
  http,
  type Address,
} from "viem";
import { base, baseSepolia } from "viem/chains";

const FUND_CHAIN_ID = Number(process.env.NEXT_PUBLIC_FUND_CHAIN_ID || base.id);

const RPC =
  process.env.NEXT_PUBLIC_RPC_BASE?.trim() ||
  process.env.NEXT_PUBLIC_RPC?.trim() ||
  "https://mainnet.base.org";

/** USDC on Base (mainnet or Sepolia via env). */
const USDC_ADDRESS = (
  process.env.NEXT_PUBLIC_USDC_BASE?.trim() ||
  process.env.NEXT_PUBLIC_USDC?.trim() ||
  (FUND_CHAIN_ID === base.id
    ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    : "0x036CbD53842c542663c958E1727696A1bc3994dd")
) as Address;

const chain = FUND_CHAIN_ID === base.id ? base : baseSepolia;

const publicClient = createPublicClient({
  chain,
  transport: http(RPC, {
    timeout: 25_000,
    retryCount: 2,
    retryDelay: 500,
  }),
});

async function readBalanceOnce(walletAddress: string): Promise<bigint> {
  return publicClient.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAddress as Address],
  });
}

export async function fetchArcUsdcBalance(
  walletAddress: string
): Promise<number> {
  try {
    const raw = await readBalanceOnce(walletAddress);
    return parseFloat(formatUnits(raw, 6));
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    const raw = await readBalanceOnce(walletAddress);
    return parseFloat(formatUnits(raw, 6));
  }
}

export function formatUsdcBalance(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  if (amount === 0) return "0.000";
  if (amount < 0.001) return amount.toFixed(6);
  return amount.toFixed(3);
}

async function readEthBalanceOnce(walletAddress: string): Promise<bigint> {
  return publicClient.getBalance({ address: walletAddress as Address });
}

export async function fetchBaseEthBalance(
  walletAddress: string
): Promise<number> {
  try {
    const raw = await readEthBalanceOnce(walletAddress);
    return parseFloat(formatEther(raw));
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    const raw = await readEthBalanceOnce(walletAddress);
    return parseFloat(formatEther(raw));
  }
}

export function formatEthBalance(amountEth: number): string {
  if (!Number.isFinite(amountEth)) return "—";
  if (amountEth === 0) return "0";
  if (amountEth < 0.000_001) return amountEth.toFixed(7);
  if (amountEth < 0.0001) return amountEth.toFixed(6);
  if (amountEth < 0.01) return amountEth.toFixed(4);
  return amountEth.toFixed(3);
}
