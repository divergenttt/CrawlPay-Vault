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
  const privy = usePrivy();

  if (ctx) return ctx;

  return {
    ready: privy.ready,
    authenticated: privy.authenticated,
    isLoggingOut: false,
    loginPhase: "idle",
    isSignedIn: privy.authenticated,
    isAuthPending: false,
    beginOAuthRedirect: () => undefined,
    beginOAuthComplete: () => undefined,
    clearLoginPhase: () => undefined,
    signOut: () => {
      void privy.logout();
    },
  };
}
