"use client";

import { useMemo } from "react";
import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
  type LinkedAccountWithMetadata,
} from "@privy-io/react-auth";

export type ClientEmbeddedWalletRef = {
  address: string;
  walletId?: string;
};

function walletFromLinkedAccounts(
  linkedAccounts: LinkedAccountWithMetadata[] | undefined
): ClientEmbeddedWalletRef | undefined {
  if (!linkedAccounts?.length) return undefined;

  for (const account of linkedAccounts) {
    if (
      account.type === "wallet" &&
      "walletClientType" in account &&
      account.walletClientType === "privy" &&
      "address" in account &&
      typeof account.address === "string"
    ) {
      const walletId =
        "id" in account && typeof account.id === "string"
          ? account.id
          : undefined;
      return { address: account.address, walletId };
    }
  }

  return undefined;
}

/** Embedded wallet address + Privy wallet id when exposed on linked accounts. */
export function useEmbeddedWalletRef(): ClientEmbeddedWalletRef | undefined {
  const { user } = usePrivy();
  const { wallets } = useWallets();

  return useMemo(() => {
    const fromLinked = walletFromLinkedAccounts(user?.linkedAccounts);
    if (fromLinked) return fromLinked;

    const embedded = getEmbeddedConnectedWallet(wallets);
    if (!embedded?.address) return undefined;

    return { address: embedded.address };
  }, [user?.linkedAccounts, wallets]);
}
