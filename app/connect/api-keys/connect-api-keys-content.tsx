"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client";
import { useAuthUi } from "@/lib/auth/auth-ui-context";
import { useServerVerifiedSession } from "@/lib/auth/use-server-verified-session";
import { useOAuthReturn } from "@/lib/auth/use-oauth-return";
import {
  SOCIAL_PROVIDERS,
  useSocialLogin,
} from "@/lib/auth/use-social-login";
import { DepositWidget } from "@/components/connect/deposit-widget";
import { OnchainSignerBanner } from "@/components/wallet/onchain-signer-banner";
import { useArcUsdcBalance } from "@/lib/wallet/use-arc-usdc-balance";
import { useEmbeddedWalletRef } from "@/lib/wallet/use-embedded-wallet-ref";
import {
  SignedInBanner,
  type SessionStatus,
} from "@/components/auth/user-account-menu";
import { ConnectSiteHeader } from "@/components/connect/connect-site-header";
import { PageTransition } from "@/components/page-transition";
import { useClientMounted, useCursor } from "@/lib/hooks";
import "@/app/connect/connect.css";
import "@/app/connect/api-keys.css";
import "@/app/dashboard/dashboard.css";

type KeyStatus = "active" | "paused" | "revoked";
type KeyRowData = {
  id: string;
  name: string;
  /** Full token — only available immediately after create. */
  token?: string;
  tokenPrefix: string;
  perReq: string;
  daily: string;
  created: string;
  status: KeyStatus;
};

type ApiKeyPublic = {
  id: string;
  name: string;
  tokenPrefix: string;
  perReq: string;
  daily: string;
  created: string;
  status: KeyStatus;
};

function apiKeyToRow(key: ApiKeyPublic, token?: string): KeyRowData {
  return {
    id: key.id,
    name: key.name,
    token,
    tokenPrefix: key.tokenPrefix,
    perReq: key.perReq,
    daily: key.daily,
    created: key.created,
    status: key.status,
  };
}

const STATUS_META = {
  active: { label: "✓ Active", cls: "active" },
  paused: { label: "○ Paused", cls: "paused" },
  revoked: { label: "× Revoked", cls: "revoked" },
} as const;

function displayToken(row: KeyRowData): string {
  return row.token ?? `${row.tokenPrefix}••••••••••••••••••••`;
}

function mask(token: string): string {
  if (!token) return "";
  return `${token.slice(0, 8)}••••••••••••••••••••${token.slice(-4)}`;
}

function KeyRow({
  row,
  index,
  justCreatedId,
  onDelete,
}: {
  row: KeyRowData;
  index: number;
  justCreatedId: string | null;
  onDelete: (id: string) => void;
}) {
  const isFresh = justCreatedId === row.id;
  const [shown, setShown] = useState(isFresh);
  const [copied, setCopied] = useState(false);
  const color = ["#4af0a8", "#5e8eff", "#ff4d63", "#ffb86c", "#9d8fff"][index % 5];

  useEffect(() => {
    if (isFresh) setShown(true);
  }, [isFresh]);

  const tokenText = displayToken(row);
  const canCopy = Boolean(row.token);

  const copy = async () => {
    if (!row.token || !navigator.clipboard) return;
    await navigator.clipboard.writeText(row.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const status = STATUS_META[row.status] ?? STATUS_META.active;

  return (
    <div className={`kx-row body${isFresh ? " fresh" : ""}`}>
      <div className="kx-name">
        <span className="botdot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        <span className="kx-name-stack">
          <span className="kx-name-label">{row.name}</span>
          <span className="kx-token-mini">
            <span className="tok">{shown ? tokenText : mask(tokenText)}</span>
            <button type="button" className="iconbtn xs" aria-label={shown ? "Hide token" : "Show token"} onClick={() => setShown((v) => !v)}>
              {shown ? "🙈" : "👁"}
            </button>
            {canCopy ? (
              <button type="button" className={`iconbtn xs${copied ? " copied" : ""}`} aria-label="Copy token" onClick={copy}>
                {copied ? "✓" : "⧉"}
              </button>
            ) : null}
          </span>
        </span>
      </div>
      <div className="kx-limits">
        <span className="kx-limit-row">
          <span className="lk">max / req</span>
          <span className="lv">{row.perReq} USDC</span>
        </span>
        <span className="kx-limit-row">
          <span className="lk">daily cap</span>
          <span className="lv">{row.daily} USDC</span>
        </span>
      </div>
      <div className="kx-date">{row.created}</div>
      <div className="col-status">
        <span className={`kx-status ${status.cls}`}>
          <span className="pulse" />
          {status.label}
        </span>
      </div>
      <div>
        <button type="button" className="kx-delete" aria-label="Delete key" onClick={() => onDelete(row.id)}>
          ✕
        </button>
      </div>
    </div>
  );
}

function AuthGateLoading() {
  return (
    <section className="kx-auth-gate">
      <div className="kx-auth-card">
        <div className="kx-auth-title">Access required to create API keys</div>
        <div className="kx-auth-sub">Loading authentication…</div>
      </div>
    </section>
  );
}

function ConnectApiKeysPageContent() {
  useCursor();
  const mounted = useClientMounted();
  const { clearLoginPhase } = useAuthUi();
  const {
    signInWithProvider,
    activeProvider,
    pending: authPending,
    error: socialLoginError,
    setError: setAuthError,
  } = useSocialLogin();
  const { isSignedIn, ready, serverVerified, sessionChecking } =
    useServerVerifiedSession(setAuthError);

  const embeddedWallet = useEmbeddedWalletRef();
  const walletAddress = embeddedWallet?.address;
  const {
    balanceUsdc,
    balanceEth,
    loading: balanceLoading,
    error: balanceError,
    refresh: refreshBalance,
    isZero: balanceIsZero,
  } = useArcUsdcBalance(isSignedIn ? walletAddress : undefined);

  useOAuthReturn(setAuthError);

  useEffect(() => {
    if (ready) setAuthError(null);
  }, [ready, setAuthError]);

  useEffect(() => {
    if (!authPending || isSignedIn) return;
    const timeout = window.setTimeout(() => {
      clearLoginPhase();
      setAuthError(
        "Sign-in is taking longer than expected. If this persists, check Privy Dashboard (Allowed domains, Google OAuth, Base mainnet wallet) and try again."
      );
    }, 40_000);
    return () => window.clearTimeout(timeout);
  }, [authPending, isSignedIn, clearLoginPhase, setAuthError]);

  const [rows, setRows] = useState<KeyRowData[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fPerReq, setFPerReq] = useState("0.01");
  const [fDaily, setFDaily] = useState("0.50");
  const [fError, setFError] = useState("");

  const loadKeys = useCallback(async () => {
    if (!isSignedIn) return;
    setKeysLoading(true);
    setKeysError(null);
    try {
      const res = await authFetch("/api/keys", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { keys: ApiKeyPublic[] };
      setRows((data.keys ?? []).map((k) => apiKeyToRow(k)));
    } catch (err) {
      setKeysError(err instanceof Error ? err.message : "Failed to load keys");
    } finally {
      setKeysLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    document.body.classList.add("connect-page");
    return () => document.body.classList.remove("connect-page");
  }, []);

  useEffect(() => {
    if (isSignedIn) void loadKeys();
  }, [isSignedIn, loadKeys]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const openModal = async () => {
    setFName("");
    setFPerReq("0.01");
    setFDaily("0.50");
    setFError("");
    setModalOpen(true);
  };

  const authError = socialLoginError;

  const sessionStatus: SessionStatus | undefined = !isSignedIn
    ? undefined
    : sessionChecking
      ? "checking"
      : serverVerified
        ? "verified"
        : "unverified";

  const deleteKey = async (id: string) => {
    try {
      const res = await authFetch(`/api/keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setRows((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setKeysError(err instanceof Error ? err.message : "Failed to delete key");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = fName.trim() || `New_Agent_Key_${rows.length + 1}`;
    const pr = parseFloat(fPerReq);
    const dl = parseFloat(fDaily);
    if (Number.isNaN(pr) || pr <= 0) return setFError("Max per request must be a positive number.");
    if (Number.isNaN(dl) || dl <= 0) return setFError("Daily limit must be a positive number.");
    if (dl < pr) return setFError("Daily limit cannot be less than per-request limit.");
    if (!walletAddress) {
      return setFError(
        "Embedded wallet is still loading. Wait a moment and try again."
      );
    }
    setFError("");
    try {
      const res = await authFetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.replace(/\s+/g, "_"),
          perReq: pr,
          daily: dl,
          ownerWalletAddress: walletAddress,
          privyWalletId: embeddedWallet?.walletId,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        key: ApiKeyPublic;
        token: string;
      };
      const fresh = apiKeyToRow(data.key, data.token);
      setRows((prev) => [fresh, ...prev]);
      setJustCreatedId(fresh.id);
      const toastMsg =
        balanceUsdc !== null && balanceUsdc === 0
          ? "Key created ✓ — top up your balance so your agent can start paying"
          : "New key created · copy it now";
      setToast(toastMsg);
      setTimeout(
        () => setToast(null),
        balanceUsdc !== null && balanceUsdc === 0 ? 4200 : 2600
      );
      setTimeout(() => setJustCreatedId(null), 4500);
      setModalOpen(false);
    } catch (err) {
      setFError(err instanceof Error ? err.message : "Failed to create key");
    }
  };

  return (
    <>
      <PageTransition />
      <div className="cursor-ring" />
      <div className="cursor-dot" />
      <main className="db-shell">
        <ConnectSiteHeader
          sessionStatus={sessionStatus}
          showAccountMenu={false}
        />

        <section className="cn-hero cn-hero-stacked">
          <div>
            <div className="cn-eyebrow">
              <span className="pip" style={{ background: "var(--c-blu)", boxShadow: "0 0 8px var(--c-blu)" }} />
              {rows.filter((r) => r.status === "active").length} active keys · Base mainnet
            </div>
            <h1 className="cn-title cn-title-nowrap">
              A secret PIN <em>for your agents.</em>
            </h1>
            <p className="cn-lede">
              Create secure tokens for your AI agents. You control per-request and daily spending limits before any wallet
              signature happens.
            </p>
          </div>
        </section>

        {!mounted ? (
          <AuthGateLoading />
        ) : null}

        {mounted && authError && !isSignedIn ? (
          <div className="kx-auth-error kx-auth-error-banner" role="alert">
            {authError.split("\n").map((line) => (
              <p key={line} className="mb-1 last:mb-0">
                {line}
              </p>
            ))}
          </div>
        ) : null}

        {mounted && !isSignedIn && !ready ? (
          <AuthGateLoading />
        ) : mounted && !isSignedIn ? (
          <section className="kx-auth-gate">
            <div className="kx-auth-card">
              <div className="kx-auth-title">Access required to create API keys</div>
              <div className="kx-auth-sub">
                {authPending
                  ? "Redirecting to provider…"
                  : "Sign in with Google, GitHub, Telegram, or X to unlock key generation and controls for your agents."}
              </div>
              <p className="kx-auth-label">Continue with</p>
              <div className="kx-social-grid">
                {SOCIAL_PROVIDERS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className="kx-social-btn"
                    disabled={!ready || authPending}
                    onClick={() => void signInWithProvider(id)}
                  >
                    {!ready
                      ? "…"
                      : authPending && activeProvider === id
                        ? "Redirecting…"
                        : label}
                  </button>
                ))}
              </div>
              {authError ? (
                <div className="kx-auth-error" role="alert">
                  {authError.split("\n").map((line) => (
                    <p key={line} className="mb-1 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : mounted && isSignedIn ? (
          <>
            <section className="kx-account-row">
              <div className="kx-account-aside">
                <SignedInBanner
                  sessionStatus={sessionStatus}
                  variant="panel"
                />
                <OnchainSignerBanner />
              </div>
              <DepositWidget
                balanceUsdc={balanceUsdc}
                balanceEth={balanceEth}
                balanceLoading={balanceLoading}
                balanceError={balanceError}
                onRefreshBalance={() => void refreshBalance()}
              />
            </section>

            <section className="kx-cta">
              <div>
                <div className="kx-cta-title">Create a key for your bot</div>
                <div className="kx-cta-sub">
                  Set a name and two spending limits - per request and per day. Works with Eliza plugin, MCP tools and direct SDK integrations.
                </div>
              </div>
              <button
                type="button"
                className="kx-generate"
                disabled={sessionChecking}
                onClick={openModal}
              >
                <span className="plus">+</span>
                {sessionChecking ? "Verifying session…" : "Generate new API Key"}
              </button>
            </section>

            <section className="cn-section">
              <div className="cn-section-head">
                <h2 className="cn-section-title">Your active keys</h2>
                <span className="cn-section-sub">
                  {keysLoading ? "Loading…" : `${rows.length} keys · live data`}
                </span>
              </div>

              {keysError ? (
                <div className="kx-auth-error kx-auth-error-banner" role="alert">
                  {keysError}
                </div>
              ) : null}

              {rows.length > 0 && balanceIsZero && !balanceLoading ? (
                <div className="kx-balance-paused-banner" role="status">
                  <span className="kx-balance-paused-icon" aria-hidden>
                    ⚠
                  </span>
                  <span>
                    Your agents are paused — no USDC balance.{" "}
                    <button
                      type="button"
                      className="kx-balance-paused-link"
                      onClick={() => void refreshBalance()}
                    >
                      Top up
                    </button>{" "}
                    to resume.
                  </span>
                </div>
              ) : null}

              <div className="kx-table">
                <div className="kx-row head">
                  <div>Name &amp; token</div>
                  <div>Limits (USDC)</div>
                  <div>Created</div>
                  <div className="col-status">Status</div>
                  <div />
                </div>
                {rows.map((row, i) => (
                  <KeyRow
                    key={row.id}
                    row={row}
                    index={i}
                    justCreatedId={justCreatedId}
                    onDelete={(id) => void deleteKey(id)}
                  />
                ))}
              </div>
            </section>
          </>
        ) : null}

        <div className="cn-foot">
          <span>Connect · API Keys · {rows.length} on file</span>
          <span>
            <Link href="/connect/web-sdk" data-page-link>
              ↗ Continue to Web SDK
            </Link>
          </span>
        </div>
      </main>

      <div className={`kx-toast${toast ? " on" : ""}`}>
        <span className="checkdot" />
        {toast}
      </div>

      {modalOpen && (
        <div className="kx-modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="kx-modal" role="dialog" aria-modal="true" aria-label="Create API key">
            <button type="button" className="kx-modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>
              ✕
            </button>
            <div className="kx-modal-eyebrow">
              <span className="pip" style={{ background: "var(--c-blu)", boxShadow: "0 0 8px var(--c-blu)" }} />
              New API key
            </div>
            <h3 className="kx-modal-title">Set a budget for the bot</h3>
            <p className="kx-modal-sub">Limits enforce spending on-chain before signing. The agent cannot exceed them.</p>

            <form className="kx-form" onSubmit={submit}>
              <label className="kx-field">
                <span className="kx-field-label">Name</span>
                <input type="text" placeholder="e.g. Eliza_Bot_Main" value={fName} onChange={(e) => setFName(e.target.value)} autoFocus />
              </label>

              <div className="kx-field-row">
                <label className="kx-field">
                  <span className="kx-field-label">Max per request</span>
                  <span className="kx-field-input-with-suffix">
                    <input type="number" step="0.001" min="0.001" value={fPerReq} onChange={(e) => setFPerReq(e.target.value)} />
                    <span className="suffix">USDC</span>
                  </span>
                </label>

                <label className="kx-field">
                  <span className="kx-field-label">Daily limit</span>
                  <span className="kx-field-input-with-suffix">
                    <input type="number" step="0.01" min="0.01" value={fDaily} onChange={(e) => setFDaily(e.target.value)} />
                    <span className="suffix">USDC / day</span>
                  </span>
                </label>
              </div>

              {fError ? <div className="kx-form-error">{fError}</div> : null}

              <div className="kx-form-actions">
                <button type="button" className="kx-btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="kx-generate compact">
                  <span className="plus">+</span>
                  Create key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ConnectApiKeysPageContent;
