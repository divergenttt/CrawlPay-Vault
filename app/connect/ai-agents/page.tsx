"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ConnectSiteHeader } from "@/components/connect/connect-site-header";
import { PageTransition } from "@/components/page-transition";
import { useCursor } from "@/lib/hooks";
import "../connect.css";
import "../agents.css";
import "@/app/dashboard/dashboard.css";

const TABS = [
  {
    id: "mcp",
    mark: "Variant A",
    tools: "Claude · Cursor · Windsurf",
    title: "MCP Server",
    sub: "Drop our server into the mcpServers config of any local AI assistant - payments happen over MCP on Base.",
  },
  {
    id: "eliza",
    mark: "Variant B",
    tools: "ElizaOS framework",
    title: "ElizaOS Plugin",
    sub: "Building autonomous agents on Eliza? Install the official plugin and inject it into your AgentRuntime.",
  },
] as const;

const MCP_JSON = `{
  "mcpServers": {
    "crawlpay-server": {
      "command": "npx",
      "args": ["-y", "@crawlpay/mcp-server"]
    }
  }
}`;

const ELIZA_BASH = `npm install @crawlpay/eliza-plugin`;
const ELIZA_TS = `import { crawlpayPlugin } from "@crawlpay/eliza-plugin";
import { AgentRuntime } from "@elizaos/core";

const runtime = new AgentRuntime({
  character,
  modelProvider,
  plugins: [crawlpayPlugin],
});`;

const LANG_META = {
  json: { label: "JSON", color: "#ffb86c" },
  bash: { label: "Bash", color: "#4af0a8" },
  ts: { label: "TypeScript", color: "#5e8eff" },
} as const;

function highlight(code: string, lang: keyof typeof LANG_META): ReactNode[] {
  const rules: Record<string, Array<{ re: RegExp; cls: string }>> = {
    json: [
      { re: /\/\/[^\n]*/g, cls: "c-com" },
      { re: /"[^"]*"(?=\s*:)/g, cls: "c-fn" },
      { re: /"[^"]*"/g, cls: "c-str" },
      { re: /\b\d+(?:\.\d+)?\b/g, cls: "c-num" },
      { re: /[{}\[\],:]/g, cls: "c-pun" },
    ],
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

export default function ConnectAiAgentsPage() {
  useCursor();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("mcp");

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
              <span className="pip" style={{ background: "var(--c-grn)", boxShadow: "0 0 8px var(--c-grn)" }} />
              Live on Base · MCP 0.4
            </div>
            <h1 className="cn-title cn-title-nowrap">
              Teach your agents to <em>pay for what they read.</em>
            </h1>
            <p className="cn-lede">
              Plug CrawlPay into autonomous agents so they can settle paywalled content on their own over the Model
              Context Protocol on Base.
            </p>
          </div>
        </section>

        <section className="cn-section">
          <div className="cn-section-head">
            <h2 className="cn-section-title">Connect AI Agents</h2>
            <span className="cn-section-sub">{tab === "mcp" ? "MCP server · npx" : "ElizaOS · plugin"}</span>
          </div>

          <div className="ag-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`ag-tab${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
                type="button"
              >
                <div className="ag-tab-top">
                  <span className="ag-tab-mark">{t.mark}</span>
                  <span className="ag-tab-tools">{t.tools}</span>
                </div>
                <div className="ag-tab-title">{t.title}</div>
                <div className="ag-tab-sub">{t.sub}</div>
              </button>
            ))}
          </div>

          <div className="ag-panel">
            <div className="ag-step-row">
              <div className="ag-step-num">1</div>
              <div className="ag-step-body">
                <div className="ag-step-title">{tab === "mcp" ? "Add CrawlPay to MCP config" : "Install the plugin"}</div>
                <div className="ag-step-desc">
                  {tab === "mcp"
                    ? "Open your assistant mcpServers config and add the entry below."
                    : "Install the package and wire crawlpayPlugin in your AgentRuntime plugins array."}
                </div>
              </div>
            </div>
            {tab === "mcp" ? (
              <CodeBlock lang="json" source={MCP_JSON} />
            ) : (
              <>
                <CodeBlock lang="bash" source={ELIZA_BASH} />
                <div style={{ height: 16 }} />
                <CodeBlock lang="ts" source={ELIZA_TS} />
              </>
            )}
          </div>
        </section>

        <div className="cn-foot">
          <span>Connect · AI Agents · MCP · Base network</span>
          <span>
            <Link href="/connect/api-keys" data-page-link>
              ↗ Need a key? See API Keys
            </Link>
          </span>
        </div>
      </main>
    </>
  );
}
