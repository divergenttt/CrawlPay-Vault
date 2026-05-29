"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchArcUsdcBalance,
  fetchBaseEthBalance,
} from "@/lib/wallet/arc-usdc";

/** Background refresh interval — avoid hammering public RPC endpoints. */
const POLL_MS = 45_000;

function toBalanceErrorMessage(err: unknown): string {
  const message =
    err instanceof Error ? err.message : "Could not load wallet balance";
  const lower = message.toLowerCase();
  if (lower.includes("timed out") || lower.includes("took too long")) {
    return "Balance temporarily unavailable (network timeout).";
  }
  return "Could not load wallet balance.";
}

export function useArcUsdcBalance(walletAddress: string | undefined) {
  const [balanceUsdc, setBalanceUsdc] = useState<number | null>(null);
  const [balanceEth, setBalanceEth] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setBalanceUsdc(null);
      setBalanceEth(null);
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
      const [usdcResult, ethResult] = await Promise.allSettled([
        fetchArcUsdcBalance(walletAddress),
        fetchBaseEthBalance(walletAddress),
      ]);

      if (!mountedRef.current) return;

      if (usdcResult.status === "fulfilled") {
        setBalanceUsdc(usdcResult.value);
        hasLoadedRef.current = true;
        setError(null);
      } else if (!isBackground) {
        setError(toBalanceErrorMessage(usdcResult.reason));
      }

      if (ethResult.status === "fulfilled") {
        setBalanceEth(ethResult.value);
      } else if (!isBackground && usdcResult.status === "fulfilled") {
        setBalanceEth(null);
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
  const ethIsZero = balanceEth !== null && balanceEth === 0;

  return {
    balanceUsdc,
    balanceEth,
    loading,
    error,
    refresh,
    isZero,
    hasFunds,
    ethIsZero,
  };
}
