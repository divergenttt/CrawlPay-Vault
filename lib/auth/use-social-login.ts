"use client";

import { useCallback, useState } from "react";
import { useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";
import { useAuthUi } from "@/lib/auth/auth-ui-context";
import { formatSocialLoginError } from "@/lib/auth/auth-errors";

import {
  isSocialProvider,
  type SocialProvider,
} from "@/lib/auth/providers";

export type { SocialProvider } from "@/lib/auth/providers";

export const SOCIAL_PROVIDERS: {
  id: SocialProvider;
  label: string;
}[] = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
  { id: "twitter", label: "X" },
  { id: "telegram", label: "Telegram" },
];

export { formatSocialLoginError } from "@/lib/auth/auth-errors";

/**
 * Direct OAuth redirect per provider (no Privy modal).
 * Avoids `exited_auth_flow` when the modal closes during redirect.
 */
export function useSocialLogin() {
  const { ready } = usePrivy();
  const { clearLoginPhase } = useAuthUi();
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<SocialProvider | null>(
    null
  );

  const { initOAuth, loading } = useLoginWithOAuth({
    onComplete: () => {
      setError(null);
      setActiveProvider(null);
      clearLoginPhase();
    },
    onError: (err) => {
      clearLoginPhase();
      const formatted = formatSocialLoginError(err);
      if (!formatted) {
        setError(null);
        setActiveProvider(null);
        return;
      }
      setError(formatted);
      setActiveProvider(null);
    },
  });

  const signInWithProvider = useCallback(
    async (provider: SocialProvider) => {
      if (!isSocialProvider(provider)) {
        setError("Unsupported sign-in provider.");
        return;
      }

      if (!ready) {
        setError("Authentication is still loading. Try again in a moment.");
        return;
      }

      setError(null);
      setActiveProvider(provider);
      try {
        await initOAuth({ provider });
      } catch (err) {
        clearLoginPhase();
        const formatted = formatSocialLoginError(err);
        if (!formatted) {
          setError(null);
          setActiveProvider(null);
          return;
        }
        setError(formatted);
        setActiveProvider(null);
      }
    },
    [clearLoginPhase, initOAuth, ready]
  );

  return {
    signInWithProvider,
    activeProvider,
    pending: loading,
    error,
    setError,
    ready,
  };
}
