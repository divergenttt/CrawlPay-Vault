"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchArcUsdcBalance } from "@/lib/wallet/arc-usdc";

const POLL_MS = 15_000;

export function useArcUsdcBalance(walletAddress: string | undefined) {
  const [balanceUsdc, setBalanceUsdc] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setBalanceUsdc(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const value = await fetchArcUsdcBalance(walletAddress);
      if (mountedRef.current) {
        setBalanceUsdc(value);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Could not load USDC balance"
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    mountedRef.current = true;
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
