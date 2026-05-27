"use client";

import { getAccessToken } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";
import { isSessionVerifyCached } from "@/lib/auth/session-cache";
import { verifyServerSession } from "@/lib/auth/client";
import { useAuthUi } from "@/lib/auth/auth-ui-context";

/**
 * Background server JWT check. UI can proceed once Privy reports a signed-in user.
 */
export function useServerVerifiedSession(
  onError: (message: string | null) => void
) {
  const { isSignedIn, ready } = useAuthUi();
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [serverVerified, setServerVerified] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setServerVerified(false);
      setSessionChecking(false);
      return;
    }

    if (isSessionVerifyCached()) {
      setServerVerified(true);
      setSessionChecking(false);
      return;
    }

    let cancelled = false;
    setSessionChecking(true);

    void (async () => {
      const token = await getAccessToken();
      if (cancelled) return;

      if (token) {
        setServerVerified(true);
        setSessionChecking(false);
      }

      const result = await verifyServerSession();
      if (cancelled) return;

      setServerVerified(result.ok);
      onErrorRef.current(result.ok ? null : result.message);
      setSessionChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  return {
    isSignedIn,
    ready,
    serverVerified,
    sessionChecking: sessionChecking && !serverVerified,
  };
}
