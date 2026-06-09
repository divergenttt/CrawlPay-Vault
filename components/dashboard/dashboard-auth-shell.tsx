"use client";

import { useEffect } from "react";
import { useOAuthReturn } from "@/lib/auth/use-oauth-return";
import { useServerVerifiedSession } from "@/lib/auth/use-server-verified-session";
import {
  SOCIAL_PROVIDERS,
  useSocialLogin,
} from "@/lib/auth/use-social-login";

function DashboardSignInGate({
  error,
  onProvider,
  activeProvider,
  pending,
  ready,
}: {
  error: string | null;
  onProvider: (id: (typeof SOCIAL_PROVIDERS)[number]["id"]) => void;
  activeProvider: (typeof SOCIAL_PROVIDERS)[number]["id"] | null;
  pending: boolean;
  ready: boolean;
}) {
  return (
    <div className="db-shell flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="mb-2 font-mono text-lg tracking-wide text-white">
          Personal cabinet
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Sign in with Google, GitHub, Telegram, or X to manage domains, pricing,
          and view bot payments.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SOCIAL_PROVIDERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className="rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white hover:border-zinc-500 disabled:opacity-50"
              disabled={!ready || pending}
              onClick={() => void onProvider(id)}
            >
              {!ready
                ? "…"
                : pending && activeProvider === id
                  ? "Redirecting…"
                  : label}
            </button>
          ))}
        </div>
        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardAuthShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    signInWithProvider,
    activeProvider,
    pending: authPending,
    error: socialLoginError,
    setError: setAuthError,
  } = useSocialLogin();
  const { isSignedIn, ready } = useServerVerifiedSession(setAuthError);

  useOAuthReturn(setAuthError);

  useEffect(() => {
    if (ready) setAuthError(null);
  }, [ready, setAuthError]);

  useEffect(() => {
    document.body.classList.add("dashboard-page");
    return () => document.body.classList.remove("dashboard-page");
  }, []);

  if (!isSignedIn && !ready) {
    return (
      <div className="db-shell flex min-h-[40vh] items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <DashboardSignInGate
        error={socialLoginError}
        onProvider={signInWithProvider}
        activeProvider={activeProvider}
        pending={authPending}
        ready={ready}
      />
    );
  }

  return <>{children}</>;
}
