"use client";

import { useRegisterPrivyServerSigner } from "@/lib/wallet/register-privy-server-signer";

/** Prompt user to grant server signing for on-chain API key settlement. */
export function OnchainSignerBanner() {
  const { status, error, register } = useRegisterPrivyServerSigner({
    autoRegister: false,
  });

  if (status === "loading_config" || status === "needs_quorum_config") {
    return null;
  }

  if (status === "registered") {
    return (
      <div className="kx-balance-paused-banner" role="status" style={{ borderColor: "var(--c-grn, #4af0a8)" }}>
        <span className="kx-balance-paused-icon" aria-hidden>
          ✓
        </span>
        <span>On-chain agent payments enabled for this wallet.</span>
      </div>
    );
  }

  const busy = status === "registering";

  return (
    <div className="kx-balance-paused-banner" role="status">
      <span className="kx-balance-paused-icon" aria-hidden>
        ⚠
      </span>
      <span>
        Enable on-chain payments so agents can send USDC from your wallet.{" "}
        <button
          type="button"
          className="kx-balance-paused-link"
          disabled={busy || status === "needs_wallet"}
          onClick={() => void register()}
        >
          {busy ? "Enabling…" : "Enable on-chain payments"}
        </button>
      </span>
      {error ? (
        <p className="mt-2 text-sm opacity-90" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
