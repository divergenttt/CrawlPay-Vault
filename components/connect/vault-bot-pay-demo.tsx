"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthUi } from "@/lib/auth/auth-ui-context";
import { formatUsdcBalance } from "@/lib/wallet/arc-usdc";
import { useArcUsdcBalance } from "@/lib/wallet/use-arc-usdc-balance";
import { useEmbeddedWalletRef } from "@/lib/wallet/use-embedded-wallet-ref";

const PAY_AMOUNT_LABEL = "$0.001 USDC";

/** Vault + agent wallet context (no in-browser pay probe). */
export function VaultBotPayContext({
  vaultId,
  className = "",
}: {
  vaultId: number;
  className?: string;
}) {
  const { isSignedIn } = useAuthUi();
  const embeddedWallet = useEmbeddedWalletRef();
  const walletAddress = isSignedIn ? embeddedWallet?.address : undefined;
  const { balanceUsdc, loading, error } = useArcUsdcBalance(walletAddress);

  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 ${className}`.trim()}
    >
      <p className="text-xs text-zinc-500 lowercase">
        vault <span className="text-emerald-400 font-mono">#{vaultId}</span> · bot charges{" "}
        {PAY_AMOUNT_LABEL} from api-key wallet on base, then story cdr decrypt
      </p>

      {isSignedIn && walletAddress ? (
        <p className="mt-2 font-mono text-[11px] text-zinc-500">
          wallet usdc:{" "}
          {loading && balanceUsdc == null ? (
            "…"
          ) : error ? (
            <span className="text-red-400/80">unavailable</span>
          ) : (
            <span className="text-zinc-300">{formatUsdcBalance(balanceUsdc ?? 0)}</span>
          )}
        </p>
      ) : (
        <p className="mt-2 text-xs text-zinc-600 lowercase">
          <Link href="/connect/api-keys" className="text-zinc-400 underline" data-page-link>
            sign in
          </Link>{" "}
          to see wallet usdc
        </p>
      )}
    </div>
  );
}

/** Shows context for CRAWLPAY_VAULT_UUID from .env.local (always on /connect/vault). */
export function VaultBotPayContextFromEnv() {
  const [vaultId, setVaultId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/vault/demo-config", { cache: "no-store" });
        const data = (await res.json()) as { vaultUuid?: number | null };
        if (!cancelled && Number.isFinite(data.vaultUuid)) {
          setVaultId(data.vaultUuid as number);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (vaultId == null) return null;

  return (
    <div className="w-full max-w-xl mx-auto mb-[30px]">
      <VaultBotPayContext vaultId={vaultId} />
    </div>
  );
}
