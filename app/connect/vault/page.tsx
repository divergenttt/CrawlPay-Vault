"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ConnectSiteHeader } from "@/components/connect/connect-site-header";
import { VaultBotPayContextFromEnv } from "@/components/connect/vault-bot-pay-demo";
import { VaultUploader } from "@/components/connect/vault-uploader";
import { PageTransition } from "@/components/page-transition";
import { useCursor } from "@/lib/hooks";
import "../connect.css";
import "../agents.css";
import "../vault.css";
import "@/app/dashboard/dashboard.css";

const UPLOAD_TS = `import { uploadVault } from "@/lib/cdr/vault";

const payload = {
  type: "premium-dataset",
  title: "Research corpus",
  data: [{ prompt: "What is x402?", response: "AI agent payments" }],
};

// Encrypt locally → IPFS pin → register policy on Story chain
const { uuid, cid } = await uploadVault(JSON.stringify(payload));
console.log("Vault Registered!", { uuid, cid });`;

const ACCESS_TS = `import { accessVault } from "@/lib/cdr/vault";

// Handle GET /api/page — extracted from incoming request headers
const vaultUuid = "4f8a91b2-c3d4-4e5f-a6b7-c8d9e0f1a2b3";
const paymentSignature = "0x71c...3a0b"; // Bot's EIP-191 proof

// After CrawlPay verifies payment, trigger TDH2 threshold decryption via Story
const decrypted = await accessVault(vaultUuid, paymentSignature);
const dataset = JSON.parse(decrypted);`;

const FLOW_STEPS = [
  {
    num: "01",
    title: "Encrypt",
    desc: "Content is encrypted locally with TDH2 keys before it ever leaves your machine.",
  },
  {
    num: "02",
    title: "IPFS",
    desc: "Ciphertext is pinned to IPFS via Pinata — no plaintext stored on-chain or in the cloud.",
  },
  {
    num: "03",
    title: "Story chain",
    desc: "Story Protocol CDR registers access conditions on Aeneid testnet. Payment is the key.",
  },
  {
    num: "04",
    title: "TDH2 decrypt",
    desc: "After x402 payment, the server reconstructs the key and returns decrypted content.",
  },
] as const;

const USE_CASES = [
  {
    pill: "Datasets",
    title: "Training & eval data",
    desc: "Sell proprietary corpora to AI labs without exposing raw files until payment clears.",
    dot: "#5e8eff",
  },
  {
    pill: "Research",
    title: "Papers & benchmarks",
    desc: "Gate preprints, lab notes, and benchmark suites behind metered agent access.",
    dot: "#4af0a8",
  },
  {
    pill: "Content",
    title: "Proprietary archives",
    desc: "License internal docs, media libraries, and premium APIs with revocable grants.",
    dot: "#ffb86c",
  },
] as const;

const LANG_META = {
  ts: { label: "TypeScript", color: "#5e8eff" },
} as const;

function highlight(code: string): ReactNode[] {
  const rules = [
    { re: /\/\/[^\n]*/g, cls: "c-com" },
    {
      re: /\b(import|from|export|const|let|var|return|new|if|else|true|false|null|undefined|async|await|function|type|interface|await)\b/g,
      cls: "c-key",
    },
    { re: /"[^"]*"|'[^']*'|`[^`]*`/g, cls: "c-str" },
    { re: /\b[a-zA-Z_$][\w$]*(?=\()/g, cls: "c-fn" },
    { re: /\b\d+(?:\.\d+)?\b/g, cls: "c-num" },
  ];

  const marks: Array<{ start: number; end: number; cls: string }> = [];
  for (const { re, cls } of rules) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(code)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = marks.some((m) => !(end <= m.start || start >= m.end));
      if (!overlaps) marks.push({ start, end, cls });
    }
  }
  marks.sort((a, b) => a.start - b.start);

  const out: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const m of marks) {
    if (m.start > cursor) out.push(<span key={key++}>{code.slice(cursor, m.start)}</span>);
    out.push(
      <span key={key++} className={m.cls}>
        {code.slice(m.start, m.end)}
      </span>
    );
    cursor = m.end;
  }
  if (cursor < code.length) out.push(<span key={key++}>{code.slice(cursor)}</span>);
  return out;
}

function CodeBlock({ source, label }: { source: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (navigator.clipboard) await navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const meta = LANG_META.ts;
  return (
    <div className="ag-codeblock">
      <div className="ag-codebar">
        <span className="ag-codebar-lang">
          <span
            className="dot"
            style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
          />
          {label}
        </span>
        <button type="button" className={`ag-copy${copied ? " copied" : ""}`} onClick={copy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="ag-code">{highlight(source)}</pre>
    </div>
  );
}

export default function ConnectVaultPage() {
  useCursor();

  useEffect(() => {
    document.body.classList.add("connect-page");
    return () => document.body.classList.remove("connect-page");
  }, []);

  return (
    <>
      <PageTransition />
      <div className="cursor-ring" />
      <div className="cursor-dot" />
      <main className="db-shell">
        <ConnectSiteHeader />

        <section className="cn-hero cn-hero-stacked">
          <div>
            <div className="cn-eyebrow">
              <span
                className="pip"
                style={{ background: "#9d8fff", boxShadow: "0 0 8px #9d8fff" }}
              />
              Story Protocol · CDR · IPFS
            </div>
            <h1 className="cn-title cn-title-nowrap">
              Private data rooms for <em>paywalled agents.</em>
            </h1>
            <p className="cn-lede">
              Confidential Data Rooms (CDR) by Story Protocol let you sell encrypted datasets and
              proprietary content. Plaintext never sits on your server — agents pay via CrawlPay,
              then TDH2 threshold decryption unlocks access.
            </p>
          </div>
        </section>

        <section className="cn-section">
          <div className="cn-section-head">
            <h2 className="cn-section-title">Try vault mode</h2>
            <span className="cn-section-sub">live upload · story cdr</span>
          </div>
          <VaultBotPayContextFromEnv />
          <VaultUploader />
        </section>

        <section className="cn-section">
          <div className="cn-section-head">
            <h2 className="cn-section-title">How it works</h2>
            <span className="cn-section-sub">Encrypt → IPFS → Story → TDH2</span>
          </div>
          <div className="vl-flow">
            {FLOW_STEPS.map((step, i) => (
              <div className="vl-flow-step" key={step.num}>
                <div className="vl-flow-num">{step.num}</div>
                <div className="vl-flow-body">
                  <div className="vl-flow-title">{step.title}</div>
                  <div className="vl-flow-desc">{step.desc}</div>
                </div>
                {i < FLOW_STEPS.length - 1 ? (
                  <div className="vl-flow-arrow" aria-hidden="true">
                    →
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="cn-section">
          <div className="cn-section-head">
            <h2 className="cn-section-title">Use cases</h2>
            <span className="cn-section-sub">Vault mode · beyond public pages</span>
          </div>
          <div className="cn-grid-3">
            {USE_CASES.map((item) => (
              <div className="cn-card" key={item.title}>
                <div className="cn-card-top">
                  <div className="cn-card-name">
                    <span
                      className="cn-bot-dot"
                      style={{ background: item.dot, boxShadow: `0 0 8px ${item.dot}` }}
                    />
                    {item.title}
                  </div>
                  <span className="cn-pill on">{item.pill}</span>
                </div>
                <p className="vl-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cn-section">
          <div className="cn-section-head">
            <h2 className="cn-section-title">SDK</h2>
            <span className="cn-section-sub">uploadVault · accessVault</span>
          </div>

          <div className="ag-panel">
            <div className="ag-step-row">
              <div className="ag-step-num">1</div>
              <div className="ag-step-body">
                <div className="ag-step-title">Upload encrypted content</div>
                <div className="ag-step-desc">
                  Seal your dataset, register access conditions on Story, and receive a vault{" "}
                  <code>uuid</code>.
                </div>
              </div>
            </div>
            <CodeBlock source={UPLOAD_TS} label="uploadVault()" />

            <div className="ag-step-row" style={{ marginTop: 28 }}>
              <div className="ag-step-num">2</div>
              <div className="ag-step-body">
                <div className="ag-step-title">Decrypt after payment</div>
                <div className="ag-step-desc">
                  Serve vault content via <code>GET /api/page</code> with{" "}
                  <code>X-CrawlPay-Vault</code> and <code>payment-signature</code>{" "}
                  — verified payment unlocks TDH2 decryption.
                </div>
              </div>
            </div>
            <CodeBlock source={ACCESS_TS} label="accessVault()" />
          </div>
        </section>

        <div className="cn-foot">
          <span>Connect · Vault · Story CDR · TDH2</span>
          <span>
            <Link href="/connect/api-keys" data-page-link>
              ↗ Need an API key? See API Keys
            </Link>
          </span>
        </div>
      </main>
    </>
  );
}
