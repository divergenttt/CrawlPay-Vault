import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getNetworkExplorerTxUrl, resolveNetworkId } from "@/lib/networks/chains"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** EVM explorer link — Base/Polygon mainnet, or Arc testnet legacy fallback. */
export function getScannerLink(
  txHash: string,
  network?: string | null
): string {
  if (!txHash?.trim()) return "";
  if (txHash.includes("-") && txHash.length < 40) {
    return "";
  }
  const normalized = txHash.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    return "";
  }

  const networkId = resolveNetworkId(network ?? undefined);
  if (networkId === "base" || networkId === "polygon") {
    return getNetworkExplorerTxUrl(normalized, networkId);
  }

  return `https://testnet.arcscan.app/tx/${normalized}`;
}

/** Short display for tx hashes, e.g. `0x3a4b...1a2b`. */
export function formatShortTxHash(txHash: string | null | undefined): string {
  if (!txHash || txHash.trim() === "") return "pending";
  const hash = txHash.trim();
  if (hash.startsWith("0x") && hash.length >= 10) {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  }
  return hash.length > 8 ? `${hash.slice(0, 8)}...` : hash;
}
