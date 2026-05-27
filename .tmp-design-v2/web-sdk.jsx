// =============================================================================
// CrawlPay · Connect → Web SDK
// One-step guide for site owners to plug the CrawlPay shield into their app.
// =============================================================================

const LogoMark = ({ size = 18, color = '#fff' }) =>
  <svg className="logo-hex" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 3 L3 12 L7 21 L11 21 L11 18 L8 18 L5 12 L8 6 L11 6 L11 3 Z" fill={color}/>
    <path d="M17 3 L21 12 L17 21 L13 21 L13 18 L16 18 L19 12 L16 6 L13 6 L13 3 Z" fill={color}/>
  </svg>;

const ConnectHeader = () => (
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

// ----------------------------------------------------------------------------
// Tiny token highlighter — handles the languages we render here.
// ----------------------------------------------------------------------------
function highlight(code, lang) {
  const rules = {
    json: [
      { re: /\/\/[^\n]*/g,        cls: 'c-com' },
      { re: /"[^"]*"(?=\s*:)/g,   cls: 'c-fn'  },
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
      { re: /\/\/[^\n]*/g,                                                                                          cls: 'c-com' },
      { re: /\b(import|from|export|const|let|var|return|new|if|else|true|false|null|undefined|async|await|function|type|interface)\b/g, cls: 'c-key' },
      { re: /"[^"]*"|'[^']*'|`[^`]*`/g,                                                                              cls: 'c-str' },
      { re: /\b[a-zA-Z_$][\w$]*(?=\()/g,                                                                              cls: 'c-fn'  },
      { re: /\b\d+(?:\.\d+)?\b/g,                                                                                    cls: 'c-num' },
    ],
  };
  const set = rules[lang] || rules.ts;

  const marks = [];
  set.forEach(({ re, cls }) => {
    let m; re.lastIndex = 0;
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

const LANG_META = {
  json: { label: 'JSON',       color: '#ffb86c' },
  bash: { label: 'Bash · Terminal', color: '#4af0a8' },
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
// Code snippets
// ----------------------------------------------------------------------------
const INSTALL_CMD = `npm install @crawlpay/sdk`;

const WIRE_TS = `import { crawlpayShield } from "@crawlpay/sdk";

export async function onRequest(req) {
  // Guard the content: bots get a 402 Payment Required,
  // humans pass through untouched.
  const result = await crawlpayShield(req, {
    price: "0.001",
    currency: "USDC",
  });

  if (!result.authorized) {
    return result.response402(); // Returns 402 for AI agents
  }
}`;

// ----------------------------------------------------------------------------
// App
// ----------------------------------------------------------------------------
function WebSdkApp() {
  useCursor();

  return (
    <React.Fragment>
      <div className="cursor-ring"></div>
      <div className="cursor-dot"></div>
      <main className="db-shell">
        <ConnectHeader />

        {/* Hero */}
        <section className="cn-hero">
          <div>
            <div className="cn-eyebrow">
              <span className="pip" style={{ background: 'var(--c-red)', boxShadow: '0 0 8px var(--c-red)' }}></span>
              0.001 USDC per hit · Base mainnet
            </div>
            <h1 className="cn-title">Stop free scraping.<br/><em>Start earning from AI traffic.</em></h1>
          </div>
          <p className="cn-lede">
            Protect your content from being slurped for free by language models and
            start charging for the bandwidth instead. The Web SDK fingerprints every
            request — humans glide through untouched; AI crawlers are asked for a
            micropayment over the CrawlPay protocol.
          </p>
        </section>

        {/* Steps panel */}
        <section className="cn-section">
          <div className="cn-section-head">
            <h2 className="cn-section-title">Monetize your site</h2>
            <span className="cn-section-sub">2 steps · ~60 seconds</span>
          </div>

          <div className="ag-panel">
            {/* Step 1 */}
            <div className="ag-step-row">
              <div className="ag-step-num">1</div>
              <div className="ag-step-body">
                <div className="ag-step-title">Install the module into your project</div>
                <div className="ag-step-desc">
                  Pull <code>@crawlpay/sdk</code> into the same project that serves your
                  pages. Works with any Node-based runtime — Next.js, Express,
                  SvelteKit, Hono, or a Cloudflare Worker.
                </div>
              </div>
            </div>
            <CodeBlock lang="bash" source={INSTALL_CMD} />

            <div style={{ height: 22 }}></div>

            {/* Step 2 */}
            <div className="ag-step-row">
              <div className="ag-step-num">2</div>
              <div className="ag-step-body">
                <div className="ag-step-title">Drop the shield in front of paid routes</div>
                <div className="ag-step-desc">
                  Call <code>crawlpayShield()</code> inside any request handler. If the
                  caller is an unverified AI agent, return the SDK's prebuilt
                  <code>402 Payment Required</code> response. Human visitors pass through
                  as if nothing was ever there.
                </div>
              </div>
            </div>
            <CodeBlock lang="ts" source={WIRE_TS} />

            <div style={{ height: 14 }}></div>

            <div className="ag-note">
              <span className="glow"></span>
              <span>
                That's the whole integration. Every paid hit streams to your
                Dashboard with the bot identity, the URL, the tx hash on Base, and the
                amount settled — receipts by default, no extra plumbing.
              </span>
            </div>
          </div>
        </section>

        <div className="cn-foot">
          <span>Connect · Web SDK · @crawlpay/sdk · MIT</span>
          <span>
            <a href="CrawlPay Dashboard.html" data-page-link>↗ Open your dashboard</a>
          </span>
        </div>
      </main>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<WebSdkApp />);
