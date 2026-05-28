"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useAuthUi } from "@/lib/auth/auth-ui-context";
import { useOAuthReturn } from "@/lib/auth/use-oauth-return";
import { useServerVerifiedSession } from "@/lib/auth/use-server-verified-session";
import { UserAccountMenu } from "@/components/auth/user-account-menu";
import {
  SOCIAL_PROVIDERS,
  useSocialLogin,
} from "@/lib/auth/use-social-login";
import {
  type ApiKeyRecord,
  formatCreatedAt,
  generateKeyId,
  generateMockToken,
  maskToken,
  nextKeyName,
} from "@/lib/connect/api-keys";

const VAULT = {
  bg: "#0b0b0c",
  card: "#121214",
  border: "#1f1f23",
  text: "#f4f4f5",
  muted: "#a1a1aa",
} as const;

function LoadingScreen() {
  return (
    <div
      className="flex min-h-screen items-center justify-center transition-opacity duration-300"
      style={{ backgroundColor: VAULT.bg, color: VAULT.muted }}
    >
      <p className="font-mono text-sm tracking-widest">INITIALIZING VAULT…</p>
    </div>
  );
}

function SocialAuthButtons({
  onProvider,
  activeProvider,
  pending,
  disabled,
}: {
  onProvider: (provider: (typeof SOCIAL_PROVIDERS)[number]["id"]) => void;
  activeProvider: (typeof SOCIAL_PROVIDERS)[number]["id"] | null;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-nowrap gap-2">
      {SOCIAL_PROVIDERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          disabled={disabled || pending}
          onClick={() => onProvider(id)}
          className="min-w-0 flex-1 rounded-lg border border-[#1f1f23] bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-[#f4f4f5] transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          {pending && activeProvider === id ? "Redirecting…" : label}
        </button>
      ))}
    </div>
  );
}

function LockScreen({
  onProvider,
  activeProvider,
  pending,
}: {
  onProvider: (provider: (typeof SOCIAL_PROVIDERS)[number]["id"]) => void;
  activeProvider: (typeof SOCIAL_PROVIDERS)[number]["id"] | null;
  pending: boolean;
}) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 transition-opacity duration-300"
      style={{ backgroundColor: VAULT.bg, color: VAULT.text }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-10 text-center shadow-2xl transition-all duration-300"
        style={{
          backgroundColor: VAULT.card,
          borderColor: VAULT.border,
        }}
      >
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border"
          style={{ borderColor: VAULT.border }}
          aria-hidden
        >
          <svg
            className="h-6 w-6 opacity-70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h1 className="mb-3 text-xl font-semibold tracking-tight">
          Access CrawlPay Vault
        </h1>
        <p
          className="mb-8 text-sm leading-relaxed"
          style={{ color: VAULT.muted }}
        >
          Sign in with Google, GitHub, Telegram, or X to open your embedded workspace on Base mainnet.
          Your autonomous agents get API keys without any Web3 setup.
        </p>
        <SocialAuthButtons
          onProvider={onProvider}
          activeProvider={activeProvider}
          pending={pending}
        />
      </div>
    </div>
  );
}

function KeysDashboard({
  authenticated,
  onProvider,
  activeProvider,
  authPending,
  keys,
  onGenerate,
  serverVerified,
  sessionChecking,
}: {
  authenticated: boolean;
  onProvider: (provider: (typeof SOCIAL_PROVIDERS)[number]["id"]) => void;
  activeProvider: (typeof SOCIAL_PROVIDERS)[number]["id"] | null;
  authPending: boolean;
  serverVerified: boolean;
  sessionChecking: boolean;
  keys: ApiKeyRecord[];
  onGenerate: () => void;
}) {
  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: VAULT.bg, color: VAULT.text }}
    >
      <header
        className="flex items-center justify-between border-b px-6 py-4 text-sm transition-colors duration-200"
        style={{ borderColor: VAULT.border }}
      >
        <span className="truncate font-mono" style={{ color: VAULT.muted }}>
          CrawlPay Vault · API Keys
        </span>
        {authenticated ? (
          <UserAccountMenu variant="dashboard" sessionStatus="verified" />
        ) : (
          <span className="shrink-0 font-mono text-xs tracking-widest opacity-50">
            [ SIGN IN BELOW ]
          </span>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <section
          className="mb-10 rounded-2xl border p-8 transition-all duration-300"
          style={{
            backgroundColor: VAULT.card,
            borderColor: VAULT.border,
          }}
        >
          {authenticated ? (
            <>
              <h2 className="mb-2 text-lg font-semibold tracking-tight">
                Create a key for your bot
              </h2>
              <p
                className="mb-8 max-w-2xl text-sm leading-relaxed"
                style={{ color: VAULT.muted }}
              >
                Each key is shown in full once, then masked forever. Give every
                agent its own key so you can pause or revoke them independently.
              </p>
              <button
                type="button"
                onClick={onGenerate}
                disabled={sessionChecking || !serverVerified}
                className="rounded-lg bg-white px-6 py-3 font-mono text-xs font-semibold tracking-widest text-black shadow-[0_0_28px_rgba(255,255,255,0.2)] transition-all duration-200 hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] active:scale-[0.98] disabled:opacity-50"
              >
                {sessionChecking
                  ? "VERIFYING SESSION…"
                  : !serverVerified
                    ? "SESSION REQUIRED"
                    : "+ GENERATE NEW API KEY"}
              </button>
            </>
          ) : (
            <div className="text-center">
              <h2 className="mb-2 text-lg font-semibold tracking-tight">
                Access required to create API keys
              </h2>
              <p
                className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed"
                style={{ color: VAULT.muted }}
              >
                Sign in with a social account to unlock key generation for your agents.
                Without authorization, key creation and management remain
                disabled.
              </p>
              <SocialAuthButtons
                onProvider={onProvider}
                activeProvider={activeProvider}
                pending={authPending}
              />
            </div>
          )}
        </section>

        <section
          className="overflow-hidden rounded-2xl border transition-all duration-300"
          style={{
            backgroundColor: VAULT.card,
            borderColor: VAULT.border,
          }}
        >
          {!authenticated ? (
            <div
              className="m-6 rounded-xl border border-dashed px-6 py-16 text-center text-sm transition-colors duration-200"
              style={{ borderColor: VAULT.border, color: VAULT.muted }}
            >
              Authorize to view and manage active API keys.
            </div>
          ) : keys.length === 0 ? (
            <div
              className="m-6 rounded-xl border border-dashed px-6 py-16 text-center text-sm transition-colors duration-200"
              style={{ borderColor: VAULT.border, color: VAULT.muted }}
            >
              No API keys yet. Generate one to connect your first agent.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr
                    className="border-b font-mono text-xs tracking-widest"
                    style={{
                      borderColor: VAULT.border,
                      color: VAULT.muted,
                    }}
                  >
                    <th className="px-6 py-4 font-normal">NAME</th>
                    <th className="px-6 py-4 font-normal">TOKEN</th>
                    <th className="px-6 py-4 font-normal">CREATED</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b transition-colors duration-150 last:border-b-0 hover:bg-white/[0.02]"
                      style={{ borderColor: VAULT.border }}
                    >
                      <td className="px-6 py-4 font-medium">{key.name}</td>
                      <td className="px-6 py-4 font-mono text-emerald-400">
                        {key.revealed ? key.token : maskToken(key.token)}
                      </td>
                      <td
                        className="px-6 py-4 font-mono text-xs"
                        style={{ color: VAULT.muted }}
                      >
                        {formatCreatedAt(key.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ConnectKeysPageContent() {
  const {
    signInWithProvider,
    activeProvider,
    pending: authPending,
    error: authError,
    setError: setAuthError,
  } = useSocialLogin();
  const { isSignedIn, ready, serverVerified, sessionChecking } =
    useServerVerifiedSession(setAuthError);
  useOAuthReturn(setAuthError);
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);

  const handleGenerate = useCallback(() => {
    setKeys((prev) => {
      const revealedPrev = prev.map((k) =>
        k.revealed ? { ...k, revealed: false } : k
      );
      const record: ApiKeyRecord = {
        id: generateKeyId(),
        name: nextKeyName(prev.length),
        token: generateMockToken(),
        createdAt: new Date(),
        revealed: true,
      };
      return [record, ...revealedPrev];
    });
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return (
      <>
        <LockScreen
          onProvider={(p) => void signInWithProvider(p)}
          activeProvider={activeProvider}
          pending={authPending}
        />
        {authError ? (
          <p className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg border border-red-500/30 bg-black/90 px-4 py-3 text-center text-xs text-red-300">
            {authError}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <KeysDashboard
      authenticated={isSignedIn}
      onProvider={(p) => void signInWithProvider(p)}
      activeProvider={activeProvider}
      authPending={authPending}
      serverVerified={serverVerified}
      sessionChecking={sessionChecking}
      keys={keys}
      onGenerate={handleGenerate}
    />
  );
}

export default dynamic(() => Promise.resolve(ConnectKeysPageContent), {
  ssr: false,
  loading: () => <LoadingScreen />,
});
