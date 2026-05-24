import { randomBytes } from "crypto";

/** Confirmed Arc Testnet transactions (testnet.arcscan.app). */
export const ARC_TESTNET_TX_HASHES = [
  "0x413117b74ac7eb0bbc26bdb5a203fb8f56d259566ec1f1dd253c5e522f05be87",
  "0x763b84e5ceceecebcfefc48fbaa921105bdfaf3d8144554304c63e764850ce65",
  "0x62c35090895b9e93ed41d451c0381897ba250992da3299ceda0f04e06767b7c7",
  "0xc048e63a105c9bae2989829b03f097ae62ccb31f719e3b9d188527d589fbd563",
  "0x15dd522d4c04146c0bb17d6e7e86e728004eb05ff8f7b4379ca0561815d15262",
] as const;

/** Unique simulated hash for payments without a real on-chain signature. */
export function generateSimulatedTxHash(): string {
  return `0x${randomBytes(32).toString("hex")}`;
}

/** @deprecated Prefer generateSimulatedTxHash() for unique simulated rows. */
export function pickSimulatedTxHash(): string {
  const index = Math.floor(Math.random() * ARC_TESTNET_TX_HASHES.length);
  return ARC_TESTNET_TX_HASHES[index];
}
