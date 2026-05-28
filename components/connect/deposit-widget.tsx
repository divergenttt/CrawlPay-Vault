"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  getEmbeddedConnectedWallet,
  useCreateWallet,
  useFundWallet,
  usePrivy,
  useWallets,
  type LinkedAccountWithMetadata,
} from "@privy-io/react-auth";
import { base, baseSepolia } from "viem/chains";

const FUND_CHAIN_ID =
  process.env.NEXT_PUBLIC_FUND_CHAIN_ID === String(base.id)
    ? base.id
    : baseSepolia.id;

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

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

export function DepositWidget() {
  const { user, ready } = usePrivy();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();
  const { createWallet } = useCreateWallet();
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [funding, setFunding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = useMemo(() => {
    const fromLinked = embeddedAddressFromUser(user?.linkedAccounts);
    if (fromLinked) return fromLinked;

    const embedded = getEmbeddedConnectedWallet(wallets);
    return embedded?.address;
  }, [user?.linkedAccounts, wallets]);

  const copyAddress = useCallback(async () => {
    if (!walletAddress || !navigator.clipboard) return;
    await navigator.clipboard.writeText(walletAddress);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    setCopied(true);
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copyTimeoutRef.current = null;
    }, 2000);
  }, [walletAddress]);

  const onCreateWallet = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      await createWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create wallet.");
    } finally {
      setCreating(false);
    }
  }, [createWallet]);

  const onTopUp = useCallback(async () => {
    if (!walletAddress) return;
    setFunding(true);
    setError(null);
    try {
      await fundWallet({
        address: walletAddress,
        options: {
          chain: { id: FUND_CHAIN_ID },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Funding flow failed.");
    } finally {
      setFunding(false);
    }
  }, [fundWallet, walletAddress]);

  const headAction =
    !ready ? null : !walletAddress ? (
      <button
        type="button"
        disabled={creating}
        onClick={() => void onCreateWallet()}
        className="kx-panel-btn kx-panel-btn-primary"
      >
        {creating ? "Creating…" : "Create wallet"}
      </button>
    ) : (
      <button
        type="button"
        disabled={funding}
        onClick={() => void onTopUp()}
        className="kx-panel-btn kx-panel-btn-primary"
      >
        {funding ? "Opening…" : "Top Up Account"}
      </button>
    );

  return (
    <div className="kx-connect-panel kx-deposit-panel">
      <p className="kx-panel-eyebrow">Wallet</p>
      <div className="kx-panel-body">
        <div className="kx-panel-row">
          <div className="kx-panel-copy">
            <h3 className="kx-panel-title">Top up balance</h3>

            {!ready ? (
              <p className="kx-panel-muted">Loading wallet…</p>
            ) : !walletAddress ? (
              <p className="kx-panel-muted">
                Create an embedded wallet to fund agent spending on-chain.
              </p>
            ) : (
              <>
                <p className="kx-panel-muted">
                  Add USDC via Privy — card, transfer, or crypto deposit.
                </p>
                <div className="kx-deposit-address">
                  <code>{shortAddress(walletAddress)}</code>
                  <button
                    type="button"
                    onClick={() => void copyAddress()}
                    className={`kx-deposit-copy${copied ? " is-copied" : ""}`}
                    aria-label={
                      copied ? "Address copied" : "Copy wallet address"
                    }
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </>
            )}

            {error ? (
              <p className="kx-panel-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          {headAction ? <div className="kx-panel-aside">{headAction}</div> : null}
        </div>
      </div>
    </div>
  );
}
