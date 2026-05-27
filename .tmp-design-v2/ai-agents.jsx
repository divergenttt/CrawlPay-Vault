// =============================================================================
// CrawlPay · Connect → AI Agents
// Two-variant page (MCP server / ElizaOS plugin) — shows devs how to wire
// up autonomous agents that can self-pay through the protocol.
// =============================================================================

const LogoMark = ({ size = 18, color = '#fff' }) =>
  <svg className="logo-hex" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 3 L3 12 L7 21 L11 21 L11 18 L8 18 L5 12 L8 6 L11 6 L11 3 Z" fill={color}/>
    <path d="M17 3 L21 12 L17 21 L13 21 L13 18 L16 18 L19 12 L16 6 L13 6 L13 3 Z" fill={color}/>
  </svg>;

const ConnectHeader = ({ title }) => {
  const t = useClock();
  const fmtTime = (d) => d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return (
    <header className="db-header">
      <div className="db-header-left">
        <a href="CrawlPay Landing.html" className="db-brand" data-page-link>
          <LogoMark size={18} color="#fff" />
          <span>CrawlPay</span>
        </a>
      </div>
      <div className="db-header-right">
        <span className="db-live">
          <span className="db-live-dot"></span>
          <span>LIVE</span>
        </span>
        <a href="CrawlPay Landing.html" className="db-back" data-page-link>← HOME</a>
      </div>
    </header>
  );
};

// ----------------------------------------------------------------------------
// Tiny token highlighter — handles the three languages we render here.
// ----------------------------------------------------------------------------
function highlight(code, lang) {
  const rules = {
    json: [
      { re: /\/\/[^\n]*/g,        cls: 'c-com' },
      { re: /"[^"]*"(?=\s*:)/g,   cls: 'c-fn'  }, // keys
      { re: /"[^"]*"/g,           cls: 'c-str' },
      { re: /\b\d+(?:\.\d+)?\b/g, cls: 'c-num' },
      { re: /[{}\[\],:]/g,        cls: 'c-pun' },
    ],
    bash: [
      { re: /#[^\n]*/g,                              cls: 'c-com' },
      { re: /\b(npm|npx|pnpm|bun|yarn|install|add|run)\b/g, cls: 'c-key' },
      { re: /(@[\w\-\/]+|[\w\-\.\/]+@[\w\.\-]+)/g,   cls: 'c-str' },
      { re: /-{1,2}[\w-]+/g,                         cls: 'c-fn'  },
    ],
    ts: [
      { re: /\/\/[^\n]*/g,                                                                                        cls: 'c-com' },
      { re: /\b(import|from|export|const|let|var|return|new|if|else|true|false|null|undefined|async|await|function|type|interface)\b/g, cls: 'c-key' },
      { re: /"[^"]*"|'[^']*'|`[^`]*`/g,                                                                            cls: 'c-str' },
      { re: /\b[a-zA-Z_$][\w$]*(?=\()/g,                                                                            cls: 'c-fn'  },
      { re: /\b\d+(?:\.\d+)?\b/g,                                                                                  cls: 'c-num' },
    ],
  };
  const set = rules[lang] || rules.ts;

  // Walk through string, collect non-overlapping matches with priority
  const marks = []; // { start, end, cls }
  set.forEach(({ re, cls }) => {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(code)) !== null) {
      const start = m.index;
      const end   = start + m[0].length;
      const overlaps = marks.some((k) => !(end <= k.start || start >= k.end));
      if (!overlaps) marks.push({ start, end, cls });
    }
  });
  marks.sort((a, b) => a.start - b.start);

  const out = [];
  let cursor = 0, k = 0;
  marks.forEach((mk) => {
    if (mk.start > cursor) out.push(<span key={k++}>{code.slice(cursor, mk.start)}</span>);
    out.push(<span key={k++} className={mk.cls}>{code.slice(mk.start, mk.end)}</span>);
    cursor = mk.end;
  });
  if (cursor < code.length) out.push(<span key={k++}>{code.slice(cursor)}</span>);
  return out;
}

// ----------------------------------------------------------------------------
// Code block — language chip + copy button + highlighted body
// ----------------------------------------------------------------------------
const LANG_META = {
  json: { label: 'JSON',       color: '#ffb86c' },
  bash: { label: 'Bash',       color: '#4af0a8' },
  ts:   { label: 'TypeScript', color: '#5e8eff' },
};

function CodeBlock({ lang, source }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const meta = LANG_META[lang] || LANG_META.ts;
  return (
    <div className="ag-codeblock">
      <div className="ag-codebar">
        <span className="ag-codebar-lang">
          <span className="dot" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}></span>
          {meta.label}
        </span>
        <button type="button" className={'ag-copy' + (copied ? ' copied' : '')} onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="ag-code">{highlight(source, lang)}</pre>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Tab definitions
// ----------------------------------------------------------------------------
const TABS = [
  {
    id: 'mcp',
    mark: 'Variant A',
    tools: 'Claude · Cursor · Windsurf',
    title: 'MCP Server',
    sub:   'Drop our server into the mcpServers config of any local AI assistant — payments happen via the Model Context Protocol on Base.',
  },
  {
    id: 'eliza',
    mark: 'Variant B',
    tools: 'ElizaOS framework',
    title: 'ElizaOS Plugin',
    sub:   'Building autonomous agents on Eliza? Install the official plugin and inject it into your AgentRuntime.',
  },
];

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

// Add crawlpayPlugin to the plugins array of your AgentRuntime
const runtime = new AgentRuntime({
  character,
  modelProvider,
  plugins: [crawlpayPlugin],
});`;

// ----------------------------------------------------------------------------
// Variant panels
// ----------------------------------------------------------------------------
function McpPanel() {
  return (
    <div className="ag-panel">
      <div className="ag-step-row">
        <div className="ag-step-num">1</div>
        <div className="ag-step-body">
          <div className="ag-step-title">Add the CrawlPay server to your MCP config</div>
          <div className="ag-step-desc">
            Open your local AI assistant's <code>mcpServers</code> configuration file
            (Claude Desktop, Cursor, Windsurf — they all share the same schema) and add
            the entry below. No keys, no install step — <code>npx</code> fetches the
            latest server on first launch.
          </div>
        </div>
      </div>

      <CodeBlock lang="json" source={MCP_JSON} />

      <div style={{ height: 14 }}></div>

      <div className="ag-note">
        <span className="glow"></span>
        <span>
          That's it. The next time your assistant hits a CrawlPay-wrapped URL, it will
          settle a micropayment on Base and stream the unlocked content straight into
          its context window — no human-in-the-loop, no broken paywalls.
        </span>
      </div>
    </div>
  );
}

function ElizaPanel() {
  return (
    <div className="ag-panel">
      <div className="ag-step-row">
        <div className="ag-step-num">1</div>
        <div className="ag-step-body">
          <div className="ag-step-title">Install the plugin</div>
          <div className="ag-step-desc">
            Pull the official package into your Eliza project. Works with both npm and pnpm workspaces.
          </div>
        </div>
      </div>
      <CodeBlock lang="bash" source={ELIZA_BASH} />

      <div style={{ height: 22 }}></div>

      <div className="ag-step-row">
        <div className="ag-step-num">2</div>
        <div className="ag-step-body">
          <div className="ag-step-title">Wire it into your AgentRuntime</div>
          <div className="ag-step-desc">
            Import <code>crawlpayPlugin</code> and pass it into the <code>plugins</code> array
            of your <code>AgentRuntime</code>. The plugin handles wallet binding, signing
            and on-chain settlement on Base automatically.
          </div>
        </div>
      </div>
      <CodeBlock lang="ts" source={ELIZA_TS} />

      <div style={{ height: 14 }}></div>

      <div className="ag-note">
        <span className="glow"></span>
        <span>
          Once registered, your Eliza agent gains a new action:{' '}
          <code>CRAWLPAY_PAYWALL_BYPASS</code>. Any tool that calls{' '}
          <code>fetch()</code> on a 402-gated URL will route through the plugin and pay
          on-chain transparently.
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// App
// ----------------------------------------------------------------------------
function AgentsApp() {
  useCursor();
  const [tab, setTab] = React.useState('mcp');

  return (
    <React.Fragment>
      <div className="cursor-ring"></div>
      <div className="cursor-dot"></div>
      <main className="db-shell">
        <ConnectHeader title="Connect · AI Agents" />

        <section className="cn-hero">
          <div>
            <div className="cn-eyebrow">
              <span className="pip" style={{ background: 'var(--c-grn)', boxShadow: '0 0 8px var(--c-grn)' }}></span>
              Live on Base · MCP 0.4
            </div>
            <h1 className="cn-title">Teach your agents to <em>pay for what they read.</em></h1>
          </div>
          <p className="cn-lede">
            Plug CrawlPay into your neural agents and autonomous bots so they can settle
            paywalled content on their own — over the Model Context Protocol, on the Base
            network. Pick the runtime you're already using; the wiring takes one minute.
          </p>
        </section>

        <section className="cn-section">
          <div className="cn-section-head">
            <h2 className="cn-section-title">Connect AI Agents</h2>
            <span className="cn-section-sub">{tab === 'mcp' ? 'MCP server · npx' : 'ElizaOS · plugin'}</span>
          </div>

          <div className="ag-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={'ag-tab' + (tab === t.id ? ' active' : '')}
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

          {tab === 'mcp' ? <McpPanel /> : <ElizaPanel />}
        </section>

        <div className="cn-foot">
          <span>Connect · AI Agents · MCP · Base network</span>
          <span>
            <a href="CrawlPay API Keys.html" data-page-link>↗ Need a key? See API Keys</a>
          </span>
        </div>
      </main>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AgentsApp />);
