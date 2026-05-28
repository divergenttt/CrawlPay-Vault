"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchArcUsdcBalance } from "@/lib/wallet/arc-usdc";

/** Background refresh interval — avoid hammering public RPC endpoints. */
const POLL_MS = 45_000;

function toBalanceErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "Could not load USDC balance";
  const lower = message.toLowerCase();
  if (lower.includes("timed out") || lower.includes("took too long")) {
    return "Balance temporarily unavailable (network timeout).";
  }
  return "Could not load USDC balance.";
}

export function useArcUsdcBalance(walletAddress: string | undefined) {
  const [balanceUsdc, setBalanceUsdc] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setBalanceUsdc(null);
      setError(null);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    const isBackground = hasLoadedRef.current;

    if (!isBackground) {
      setLoading(true);
      setError(null);
    }

    try {
      const value = await fetchArcUsdcBalance(walletAddress);
      if (mountedRef.current) {
        setBalanceUsdc(value);
        hasLoadedRef.current = true;
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current && !isBackground) {
        setError(toBalanceErrorMessage(err));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    mountedRef.current = true;
    hasLoadedRef.current = false;
    void refresh();

    const interval = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const isZero = balanceUsdc !== null && balanceUsdc === 0;
  const hasFunds = balanceUsdc !== null && balanceUsdc > 0;

  return {
    balanceUsdc,
    loading,
    error,
    refresh,
    isZero,
    hasFunds,
  };
}
