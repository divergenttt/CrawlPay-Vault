"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo-mark";
import { PageTransition } from "@/components/page-transition";
import { useCursor } from "@/lib/hooks";
import "../connect.css";
import "../api-keys.css";
import "@/app/dashboard/dashboard.css";

type KeyStatus = "active" | "paused" | "revoked";
type KeyRowData = {
  id: string;
  name: string;
  token: string;
  perReq: string;
  daily: string;
  created: string;
  status: KeyStatus;
};

const SEED: KeyRowData[] = [
  { id: "k1", name: "Eliza_Bot_Main", token: "cr_live_8d7c1a4e92b6f0a3c8e4d1f29b5a4a2b", perReq: "0.01", daily: "0.50", created: "26.05.2026", status: "active" },
  { id: "k2", name: "Claude_Desktop", token: "cr_live_3a5f7b1c9e2d8a4f0c6b1d2e3f47e3c1", perReq: "0.005", daily: "0.25", created: "14.05.2026", status: "active" },
  { id: "k3", name: "Research_Worker", token: "cr_live_2c4e6f8a0b1d3e5f7a9c1e2d3f4ab8d2", perReq: "0.02", daily: "1.00", created: "02.05.2026", status: "paused" },
  { id: "k4", name: "CI_Eliza_Staging", token: "cr_live_9b1e4f8c2a3d6e0f5a7b9c1d3e5f7d1a", perReq: "0.001", daily: "0.10", created: "11.04.2026", status: "revoked" },
];

const STATUS_META = {
  active: { label: "✓ Active", cls: "active" },
  paused: { label: "○ Paused", cls: "paused" },
  revoked: { label: "× Revoked", cls: "revoked" },
} as const;

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

function newToken(): string {
  return `cr_live_${randomHex(32)}`;
}

function mask(token: string): string {
  if (!token) return "";
  return `${token.slice(0, 8)}••••••••••••••••••••${token.slice(-4)}`;
}

function ConnectHeader() {
  return (
    <header className="db-header cn-fixed-header">
      <div className="db-header-left">
        <Link href="/" className="db-brand" data-page-link>
          <LogoMark size={18} color="#fff" />
          <span>CrawlPay</span>
        </Link>
      </div>
      <div className="db-header-right">
        <span className="db-live">
          <span className="db-live-dot" />
          <span>LIVE</span>
        </span>
        <Link href="/" className="db-back" data-page-link>
          ← HOME
        </Link>
      </div>
    </header>
  );
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

  const copy = async () => {
    if (navigator.clipboard) await navigator.clipboard.writeText(row.token);
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
            <span className="tok">{shown ? row.token : mask(row.token)}</span>
            <button type="button" className="iconbtn xs" aria-label={shown ? "Hide token" : "Show token"} onClick={() => setShown((v) => !v)}>
              {shown ? "🙈" : "👁"}
            </button>
            <button type="button" className={`iconbtn xs${copied ? " copied" : ""}`} aria-label="Copy token" onClick={copy}>
              {copied ? "✓" : "⧉"}
            </button>
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

export default function ConnectApiKeysPage() {
  useCursor();
  const [rows, setRows] = useState<KeyRowData[]>(SEED);
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  const [fName, setFName] = useState("");
  const [fPerReq, setFPerReq] = useState("0.01");
  const [fDaily, setFDaily] = useState("0.50");
  const [fError, setFError] = useState("");

  useEffect(() => {
    document.body.classList.add("connect-page");
    return () => document.body.classList.remove("connect-page");
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const openModal = () => {
    setFName("");
    setFPerReq("0.01");
    setFDaily("0.50");
    setFError("");
    setModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = fName.trim() || `New_Agent_Key_${rows.length + 1}`;
    const pr = parseFloat(fPerReq);
    const dl = parseFloat(fDaily);
    if (Number.isNaN(pr) || pr <= 0) return setFError("Max per request must be a positive number.");
    if (Number.isNaN(dl) || dl <= 0) return setFError("Daily limit must be a positive number.");
    if (dl < pr) return setFError("Daily limit cannot be less than per-request limit.");

    const fresh: KeyRowData = {
      id: `k${Date.now()}`,
      name: name.replace(/\s+/g, "_"),
      token: newToken(),
      perReq: pr.toFixed(pr < 0.01 ? 3 : 2),
      daily: dl.toFixed(dl < 0.01 ? 3 : 2),
      created: new Date().toLocaleDateString("en-GB").replace(/\//g, "."),
      status: "active",
    };

    setRows((prev) => [fresh, ...prev]);
    setJustCreatedId(fresh.id);
    setToast("New key created · copy it now");
    setTimeout(() => setToast(null), 2600);
    setTimeout(() => setJustCreatedId(null), 4500);
    setModalOpen(false);
  };

  return (
    <>
      <PageTransition />
      <div className="cursor-ring" />
      <div className="cursor-dot" />
      <main className="db-shell">
        <ConnectHeader />

        <section className="cn-hero">
          <div>
            <div className="cn-eyebrow">
              <span className="pip" style={{ background: "var(--c-blu)", boxShadow: "0 0 8px var(--c-blu)" }} />
              {rows.filter((r) => r.status === "active").length} active keys · Base mainnet
            </div>
            <h1 className="cn-title">
              A secret PIN <em>for your agents.</em>
            </h1>
          </div>
          <p className="cn-lede">
            Create secure tokens for your AI agents. You control per-request and daily spending limits before any wallet
            signature happens.
          </p>
        </section>

        <section className="kx-cta">
          <div>
            <div className="kx-cta-title">Create a key for your bot</div>
            <div className="kx-cta-sub">
              Set a name and two spending limits - per request and per day. Works with Eliza plugin, MCP tools and direct SDK integrations.
            </div>
          </div>
          <button type="button" className="kx-generate" onClick={openModal}>
            <span className="plus">+</span>
            Generate new API Key
          </button>
        </section>

        <section className="cn-section">
          <div className="cn-section-head">
            <h2 className="cn-section-title">Your active keys</h2>
            <span className="cn-section-sub">{rows.length} keys · live data</span>
          </div>

          <div className="kx-table">
            <div className="kx-row head">
              <div>Name &amp; token</div>
              <div>Limits (USDC)</div>
              <div>Created</div>
              <div className="col-status">Status</div>
              <div />
            </div>
            {rows.map((row, i) => (
              <KeyRow key={row.id} row={row} index={i} justCreatedId={justCreatedId} onDelete={(id) => setRows((prev) => prev.filter((k) => k.id !== id))} />
            ))}
          </div>
        </section>

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
