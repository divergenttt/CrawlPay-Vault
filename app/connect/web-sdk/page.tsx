"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ConnectSiteHeader } from "@/components/connect/connect-site-header";
import { PageTransition } from "@/components/page-transition";
import { useCursor } from "@/lib/hooks";
import "../connect.css";
import "../agents.css";
import "@/app/dashboard/dashboard.css";

const INSTALL_CMD = `npm install @crawlpay/sdk`;
const WIRE_TS = `import { crawlpayShield } from "@crawlpay/sdk";

export async function onRequest(req) {
  const result = await crawlpayShield(req, {
    price: "0.001",
    currency: "USDC",
  });

  if (!result.authorized) {
    return result.response402();
  }
}`;

const LANG_META = {
  bash: { label: "Bash · Terminal", color: "#4af0a8" },
  ts: { label: "TypeScript", color: "#5e8eff" },
} as const;

function highlight(code: string, lang: keyof typeof LANG_META): ReactNode[] {
  const rules: Record<string, Array<{ re: RegExp; cls: string }>> = {
    bash: [
      { re: /#[^\n]*/g, cls: "c-com" },
      { re: /\b(npm|npx|pnpm|bun|yarn|install|add|run)\b/g, cls: "c-key" },
      { re: /(@[\w\-\/]+|[\w\-./]+@[\w.-]+)/g, cls: "c-str" },
      { re: /-{1,2}[\w-]+/g, cls: "c-fn" },
    ],
    ts: [
      { re: /\/\/[^\n]*/g, cls: "c-com" },
      { re: /\b(import|from|export|const|let|var|return|new|if|else|true|false|null|undefined|async|await|function|type|interface)\b/g, cls: "c-key" },
      { re: /"[^"]*"|'[^']*'|`[^`]*`/g, cls: "c-str" },
      { re: /\b[a-zA-Z_$][\w$]*(?=\()/g, cls: "c-fn" },
      { re: /\b\d+(?:\.\d+)?\b/g, cls: "c-num" },
    ],
  };

  const set = rules[lang] ?? rules.ts;
  const marks: Array<{ start: number; end: number; cls: string }> = [];
  for (const { re, cls } of set) {
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

function CodeBlock({ lang, source }: { lang: keyof typeof LANG_META; source: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (navigator.clipboard) await navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const meta = LANG_META[lang];
  return (
    <div className="ag-codeblock">
      <div className="ag-codebar">
        <span className="ag-codebar-lang">
          <span className="dot" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
          {meta.label}
        </span>
        <button type="button" className={`ag-copy${copied ? " copied" : ""}`} onClick={copy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="ag-code">{highlight(source, lang)}</pre>
    </div>
  );
}

export default function ConnectWebSdkPage() {
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
              <span className="pip" style={{ background: "var(--c-red)", boxShadow: "0 0 8px var(--c-red)" }} />
              0.001 USDC per hit · Base mainnet
            </div>
            <h1 className="cn-title cn-title-nowrap">
              Stop free scraping. <em>Start earning from AI traffic.</em>
            </h1>
            <p className="cn-lede">
              Protect your content from free model scraping and charge AI traffic. Humans pass through untouched; bots receive
              a standards-based 402 payment flow.
            </p>
          </div>
        </section>

        <section className="cn-section">
          <div className="cn-section-head">
            <h2 className="cn-section-title">Monetize your site</h2>
            <span className="cn-section-sub">2 steps · ~60 seconds</span>
          </div>

          <div className="ag-panel">
            <div className="ag-step-row">
              <div className="ag-step-num">1</div>
              <div className="ag-step-body">
                <div className="ag-step-title">Install the module into your project</div>
                <div className="ag-step-desc">Use npm or pnpm in the same app that serves your routes.</div>
              </div>
            </div>
            <CodeBlock lang="bash" source={INSTALL_CMD} />
            <div style={{ height: 22 }} />
            <div className="ag-step-row">
              <div className="ag-step-num">2</div>
              <div className="ag-step-body">
                <div className="ag-step-title">Drop the shield in front of paid routes</div>
                <div className="ag-step-desc">Call crawlpayShield in your request handler and return the prepared 402 response when needed.</div>
              </div>
            </div>
            <CodeBlock lang="ts" source={WIRE_TS} />
          </div>
        </section>

        <div className="cn-foot">
          <span>Connect · Web SDK · @crawlpay/sdk · MIT</span>
          <span>
            <Link href="/dashboard" data-page-link>
              ↗ Open your dashboard
            </Link>
          </span>
        </div>
      </main>
    </>
  );
}
