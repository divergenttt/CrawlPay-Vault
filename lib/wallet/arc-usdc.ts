import { createPublicClient, erc20Abi, formatUnits, http, type Address } from "viem";

const ARC_RPC =
  process.env.NEXT_PUBLIC_RPC?.trim() || "https://rpc.testnet.arc.network";

const USDC_ADDRESS = (
  process.env.NEXT_PUBLIC_USDC?.trim() ||
  process.env.USDC_CONTRACT_ADDRESS?.trim() ||
  "0x3600000000000000000000000000000000000000"
) as Address;

const publicClient = createPublicClient({
  transport: http(ARC_RPC),
});

export async function fetchArcUsdcBalance(
  walletAddress: string
): Promise<number> {
  const raw = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAddress as Address],
  });

  return parseFloat(formatUnits(raw, 6));
}

export function formatUsdcBalance(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  if (amount === 0) return "0.000";
  if (amount < 0.001) return amount.toFixed(6);
  return amount.toFixed(3);
}
