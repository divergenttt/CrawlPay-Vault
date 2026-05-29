"use client";

import { useCallback, useRef, useState } from "react";
import {
  useCreateWallet,
  useFundWallet,
  usePrivy,
} from "@privy-io/react-auth";
import { base } from "viem/chains";
import { formatEthBalance, formatUsdcBalance } from "@/lib/wallet/arc-usdc";
import { useEmbeddedWalletAddress } from "@/lib/wallet/use-embedded-wallet-address";

const FUND_CHAIN_ID = Number(process.env.NEXT_PUBLIC_FUND_CHAIN_ID || base.id);

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type DepositWidgetProps = {
  balanceUsdc: number | null;
  balanceEth?: number | null;
  balanceLoading?: boolean;
  balanceError?: string | null;
  onRefreshBalance?: () => void;
};

export function DepositWidget({
  balanceUsdc,
  balanceEth = null,
  balanceLoading = false,
  balanceError = null,
  onRefreshBalance,
}: DepositWidgetProps) {
  const { ready } = usePrivy();
  const walletAddress = useEmbeddedWalletAddress();
  const { fundWallet } = useFundWallet();
  const { createWallet } = useCreateWallet();
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [funding, setFunding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onRefreshBalance?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create wallet.");
    } finally {
      setCreating(false);
    }
  }, [createWallet, onRefreshBalance]);

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
      onRefreshBalance?.();
    }
  }, [fundWallet, onRefreshBalance, walletAddress]);

  const showZeroHint =
    walletAddress && balanceUsdc !== null && balanceUsdc === 0;

  const balancesLoading = balanceLoading && balanceUsdc === null;
  const usdcDisplay = balancesLoading
    ? "…"
    : balanceError
      ? "—"
      : `${formatUsdcBalance(balanceUsdc ?? 0)} USDC`;
  const ethDisplay = balancesLoading
    ? "…"
    : balanceError
      ? "—"
      : `${formatEthBalance(balanceEth ?? 0)} ETH`;

  const headAction =
    !ready ? null : !walletAddress ? (
      <button
        type="button"
        disabled={creating}
        onClick={() => void onCreateWallet()}
        className="kx-panel-btn kx-panel-btn-primary"
        title="Wallet is created on sign-in; use if it did not appear"
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
                Setting up your embedded wallet on Base mainnet… If this takes
                more than a few seconds, use Create wallet on the right.
              </p>
            ) : (
              <>
                <p className="kx-wallet-balance">
                  Balance:{" "}
                  <span className="kx-wallet-balance-items">
                    <strong>{usdcDisplay}</strong>
                    <strong>{ethDisplay}</strong>
                  </span>
                </p>
                {showZeroHint ? (
                  <p className="kx-panel-muted kx-panel-warn">
                    Top up{" "}
                    <span className="kx-balance-asset">USDC</span> and a little{" "}
                    <span className="kx-balance-asset">ETH</span> for gas to
                    activate your agents
                  </p>
                ) : (
                  <p className="kx-panel-muted">
                    Agent payments use{" "}
                    <span className="kx-balance-asset">USDC</span> on Base
                    mainnet for transfers and a small amount of{" "}
                    <span className="kx-balance-asset">ETH</span> for gas. Top up
                    via Privy (card, transfer, or crypto).
                  </p>
                )}
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
            {balanceError && walletAddress && balanceUsdc === null ? (
              <p className="kx-panel-error" role="alert">
                {balanceError}
              </p>
            ) : null}
          </div>
          {headAction ? <div className="kx-panel-aside">{headAction}</div> : null}
        </div>
      </div>
    </div>
  );
}
