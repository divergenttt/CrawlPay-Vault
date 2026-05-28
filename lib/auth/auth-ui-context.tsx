"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { clearSessionVerifyCache } from "@/lib/auth/session-cache";

export type LoginPhase = "idle" | "redirecting" | "completing";

type AuthUiContextValue = {
  ready: boolean;
  authenticated: boolean;
  isLoggingOut: boolean;
  loginPhase: LoginPhase;
  /** Signed-in UI — false immediately after Sign out. */
  isSignedIn: boolean;
  /** OAuth redirect in progress or finishing after return from provider. */
  isAuthPending: boolean;
  beginOAuthRedirect: () => void;
  beginOAuthComplete: () => void;
  clearLoginPhase: () => void;
  signOut: () => void;
};

const AuthUiContext = createContext<AuthUiContextValue | null>(null);

/** Safe defaults when Privy is not mounted (SSR or missing app id). */
export const AUTH_UI_STUB: AuthUiContextValue = {
  ready: false,
  authenticated: false,
  isLoggingOut: false,
  loginPhase: "idle",
  isSignedIn: false,
  isAuthPending: false,
  beginOAuthRedirect: () => undefined,
  beginOAuthComplete: () => undefined,
  clearLoginPhase: () => undefined,
  signOut: () => undefined,
};

export function AuthUiStubProvider({ children }: { children: ReactNode }) {
  return (
    <AuthUiContext.Provider value={AUTH_UI_STUB}>
      {children}
    </AuthUiContext.Provider>
  );
}

export function AuthUiProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, logout } = usePrivy();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loginPhase, setLoginPhase] = useState<LoginPhase>("idle");

  const hasSessionUser = Boolean(user?.id);

  useEffect(() => {
    if (!authenticated && !hasSessionUser) return;
    setLoginPhase("idle");
    setIsLoggingOut(false);
  }, [authenticated, hasSessionUser]);

  const beginOAuthRedirect = useCallback(() => {
    setLoginPhase("redirecting");
  }, []);

  const beginOAuthComplete = useCallback(() => {
    setLoginPhase("completing");
  }, []);

  const clearLoginPhase = useCallback(() => {
    setLoginPhase("idle");
  }, []);

  const signOut = useCallback(() => {
    setIsLoggingOut(true);
    setLoginPhase("idle");
    clearSessionVerifyCache();
    void logout().catch(() => {
      setIsLoggingOut(false);
    });
  }, [logout]);

  const isSignedIn = (authenticated || hasSessionUser) && !isLoggingOut;
  /** Only block UI while leaving for the OAuth provider — not during return/exchange. */
  const isAuthPending = loginPhase === "redirecting";

  return (
    <AuthUiContext.Provider
      value={{
        ready,
        authenticated,
        isLoggingOut,
        loginPhase,
        isSignedIn,
        isAuthPending,
        beginOAuthRedirect,
        beginOAuthComplete,
        clearLoginPhase,
        signOut,
      }}
    >
      {children}
    </AuthUiContext.Provider>
  );
}

export function useAuthUi(): AuthUiContextValue {
  const ctx = useContext(AuthUiContext);
  return ctx ?? AUTH_UI_STUB;
}
