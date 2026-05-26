import { randomBytes } from "crypto";

/** Unique simulated hash for payments without a real on-chain signature. */
export function generateSimulatedTxHash(): string {
  return `0x${randomBytes(32).toString("hex")}`;
}
