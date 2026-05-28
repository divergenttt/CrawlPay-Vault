"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrivy, useSigners } from "@privy-io/react-auth";
import { useEmbeddedWalletRef } from "@/lib/wallet/use-embedded-wallet-ref";

const STORAGE_PREFIX = "crawlpay-privy-signer:";
const BUILD_TIME_QUORUM_ID =
  process.env.NEXT_PUBLIC_PRIVY_SIGNER_QUORUM_ID?.trim() || null;

export type ServerSignerStatus =
  | "idle"
  | "loading_config"
  | "needs_login"
  | "needs_wallet"
  | "needs_quorum_config"
  | "registering"
  | "registered"
  | "error";

async function fetchSignerQuorumId(): Promise<string | null> {
  try {
    const res = await fetch("/api/config/public", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { privySignerQuorumId?: string | null };
      const fromApi = data.privySignerQuorumId?.trim();
      if (fromApi) return fromApi;
    }
  } catch {
    // fall through to build-time env
  }
  return BUILD_TIME_QUORUM_ID;
}

export function useRegisterPrivyServerSigner(options?: {
  autoRegister?: boolean;
}): {
  status: ServerSignerStatus;
  error: string | null;
  register: () => Promise<boolean>;
} {
  const autoRegister = options?.autoRegister ?? true;
  const { ready, authenticated } = usePrivy();
  const { addSigners } = useSigners();
  const wallet = useEmbeddedWalletRef();
  const [quorumId, setQuorumId] = useState<string | null>(null);
  const [status, setStatus] = useState<ServerSignerStatus>("loading_config");
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetchSignerQuorumId().then((id) => {
      if (cancelled) return;
      setQuorumId(id);
      if (!id) setStatus("needs_quorum_config");
      else if (!ready) setStatus("loading_config");
      else if (!authenticated) setStatus("needs_login");
      else if (!wallet?.address) setStatus("needs_wallet");
      else setStatus("idle");
    });
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, wallet?.address]);

  const register = useCallback(async (): Promise<boolean> => {
    if (inflight.current) return false;

    const signerQuorumId = quorumId ?? (await fetchSignerQuorumId());
    if (!signerQuorumId) {
      setStatus("needs_quorum_config");
      setError("Server signer quorum id is not configured.");
      return false;
    }
    setQuorumId(signerQuorumId);

    if (!authenticated) {
      setStatus("needs_login");
      setError("Sign in first.");
      return false;
    }
    if (!wallet?.address) {
      setStatus("needs_wallet");
      setError("Embedded wallet is still loading.");
      return false;
    }

    const storageKey = `${STORAGE_PREFIX}${wallet.address.toLowerCase()}`;
    if (localStorage.getItem(storageKey) === signerQuorumId) {
      setStatus("registered");
      setError(null);
      return true;
    }

    inflight.current = true;
    setStatus("registering");
    setError(null);

    try {
      await addSigners({
        address: wallet.address,
        signers: [{ signerId: signerQuorumId, policyIds: [] }],
      });
      localStorage.setItem(storageKey, signerQuorumId);
      setStatus("registered");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to register server signer";
      setStatus("error");
      setError(message);
      return false;
    } finally {
      inflight.current = false;
    }
  }, [quorumId, authenticated, wallet?.address, addSigners]);

  useEffect(() => {
    if (!autoRegister || !quorumId || !ready || !authenticated || !wallet?.address) {
      return;
    }
    const storageKey = `${STORAGE_PREFIX}${wallet.address.toLowerCase()}`;
    if (localStorage.getItem(storageKey) === quorumId) {
      setStatus("registered");
      return;
    }
    void register();
  }, [autoRegister, quorumId, ready, authenticated, wallet?.address, register]);

  return { status, error, register };
}
