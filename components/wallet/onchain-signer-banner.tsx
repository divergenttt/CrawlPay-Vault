"use client";

import type { ReactNode } from "react";
import { useRegisterPrivyServerSigner } from "@/lib/wallet/register-privy-server-signer";

function BannerShell({
  children,
  tone = "warn",
}: {
  children: ReactNode;
  tone?: "warn" | "ok";
}) {
  return (
    <div
      className="kx-balance-paused-banner kx-onchain-signer-banner"
      role="status"
      style={
        tone === "ok"
          ? { borderColor: "var(--c-grn, #4af0a8)" }
          : undefined
      }
    >
      <div className="kx-onchain-banner-content">{children}</div>
    </div>
  );
}

/** Prompt user to grant server signing for on-chain API key settlement. */
export function OnchainSignerBanner() {
  const { status, error, register } = useRegisterPrivyServerSigner({
    autoRegister: false,
  });

  if (status === "loading_config") {
    return (
      <div
        className="kx-balance-paused-banner kx-onchain-signer-banner kx-onchain-banner-placeholder"
        aria-hidden
      />
    );
  }

  if (status === "needs_quorum_config") {
    return null;
  }

  if (status === "registered") {
    return (
      <BannerShell tone="ok">
        <span className="kx-balance-paused-icon" aria-hidden>
          ✓
        </span>
        <span>On-chain agent payments enabled for this wallet.</span>
      </BannerShell>
    );
  }

  const busy = status === "registering";

  return (
    <BannerShell>
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
        {error ? (
          <p className="kx-onchain-banner-error" role="alert">
            {error}
          </p>
        ) : null}
      </span>
    </BannerShell>
  );
}
