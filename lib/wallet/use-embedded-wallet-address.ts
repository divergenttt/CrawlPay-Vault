"use client";

import { useMemo } from "react";
import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
  type LinkedAccountWithMetadata,
} from "@privy-io/react-auth";

function embeddedAddressFromUser(
  linkedAccounts: LinkedAccountWithMetadata[] | undefined
): string | undefined {
  if (!linkedAccounts?.length) return undefined;

  for (const account of linkedAccounts) {
    if (
      account.type === "wallet" &&
      "walletClientType" in account &&
      account.walletClientType === "privy" &&
      "address" in account &&
      typeof account.address === "string"
    ) {
      return account.address;
    }
  }

  return undefined;
}

export function useEmbeddedWalletAddress(): string | undefined {
  const { user } = usePrivy();
  const { wallets } = useWallets();

  return useMemo(() => {
    const fromLinked = embeddedAddressFromUser(user?.linkedAccounts);
    if (fromLinked) {
      return fromLinked;
    }

    const embedded = getEmbeddedConnectedWallet(wallets);
    return embedded?.address;
  }, [user?.linkedAccounts, wallets]);
}
