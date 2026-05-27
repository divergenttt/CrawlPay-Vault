"use client";

import { useEffect, useRef } from "react";
import { getAccessToken } from "@privy-io/react-auth";
import { useAuthUi } from "@/lib/auth/auth-ui-context";
import { formatSocialLoginError } from "@/lib/auth/auth-errors";
import { isSocialProvider } from "@/lib/auth/providers";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  twitter: "X (Twitter)",
  telegram: "Telegram",
};

function hasOAuthQueryParams(params: URLSearchParams): boolean {
  return (
    params.has("privy_oauth_code") ||
    params.has("privy_oauth_state") ||
    params.has("privy_oauth_provider") ||
    params.has("privy_oauth_error")
  );
}

function readOAuthUrlError(params: URLSearchParams): string | null {
  const code = params.get("privy_oauth_code");
  const explicit = params.get("privy_oauth_error");
  const provider = params.get("privy_oauth_provider");

  if (code === "error" || explicit) {
    const label =
      provider && isSocialProvider(provider)
        ? PROVIDER_LABELS[provider]
        : "provider";
    const detail = explicit ?? "oauth_error";
    const formatted = formatSocialLoginError(detail);
    if (formatted) {
      return [`Sign-in with ${label} failed.`, formatted].join("\n");
    }
    return `Sign-in with ${label} failed. Check Privy Dashboard OAuth settings.`;
  }

  return null;
}

function stripOAuthParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (!hasOAuthQueryParams(params)) return;
  window.history.replaceState({}, "", window.location.pathname);
}

/**
 * OAuth return: surface URL errors; strip ?privy_oauth_* only after access token exists.
 */
export function useOAuthReturn(onError: (message: string) => void) {
  const handled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handled.current) return;

    const params = new URLSearchParams(window.location.search);
    if (!hasOAuthQueryParams(params)) return;

    const urlError = readOAuthUrlError(params);
    if (urlError) {
      handled.current = true;
      onError(urlError);
      stripOAuthParamsFromUrl();
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const finishWhenReady = async () => {
      if (cancelled || handled.current) return;
      attempts += 1;

      const token = await getAccessToken();
      if (token) {
        handled.current = true;
        stripOAuthParamsFromUrl();
        return;
      }

      if (attempts < 40) {
        window.setTimeout(finishWhenReady, 25);
      }
    };

    void finishWhenReady();

    return () => {
      cancelled = true;
    };
  }, [onError]);
}
