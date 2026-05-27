// Section 01 — Two modes
const ModesSection = () => {
  const cards = [
    {
      label: 'STANDARD · X402',
      title: 'Public pages, metered.',
      body: 'A 402 Payment Required handshake replaces robots.txt. Any crawler that handles HTTP correctly can stream your content - and pay per request.',
      code: "GET /article  →  402 → 200 OK",
    },
    {
      label: 'VAULT · STORY CDR',
      title: 'Private encrypted datasets.',
      body: 'Wrap proprietary corpora with Confidential Data Rooms. Only paying agents holding a signed grant can decrypt. Revoke any time.',
      code: "cdr.encrypt(dataset, grant)",
    },
    {
      label: 'SEARCH · EXA',
      title: 'Full autonomous loop.',
      body: 'Agents query, pay, retrieve, and cite - without a human in the chain. Indexed by Exa, settled by Circle, no rate limits.',
      code: "exa.search({ budget: $0.10 })",
    },
    {
      label: 'SDK · 2 MINUTES',
      title: 'One package, any framework.',
      body: 'Drop-in middleware for Next, Hono, Express, Fastify, Cloudflare Workers. TypeScript types and React hooks included.',
      code: "npm install @crawlpay/sdk",
    },
  ];
  return (
    <section className="section" id="protocol">
      <div className="section-head">
        <div>
          <div className="section-num">01 — Architecture</div>
        </div>
        <div>
          <h2 className="section-title">
            Two modes. <span className="a">One protocol.</span>
          </h2>
        </div>
      </div>
      <div className="cards-2x2">
        {cards.map((c, i) => (
          <div className="mode-card fade-up hoverable" key={i}>
            <div className="mode-label">{c.label}</div>
            <div className="mode-title">{c.title}</div>
            <div className="mode-body">{c.body}</div>
            <div className="code-block">{c.code}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Section 02 — Stack
const StackSection = () => {
  const integrations = [
    { badge: 'PAYMENTS', name: 'Arc + Circle', desc: 'USDC settlement on Arc L2. Final in 800ms, gas paid by the agent.' },
    { badge: 'PROTOCOL', name: 'x402', desc: 'HTTP 402 reborn. Wallet-signed receipts, no API keys to leak.' },
    { badge: 'PRIVACY', name: 'Story CDR', desc: 'Confidential Data Rooms. Hold keys, not user data - provable revocation.' },
    { badge: 'SEARCH', name: 'Exa', desc: 'Indexed by intent, not by spam. Agents reach you because you matter.' },
    { badge: 'STORAGE', name: 'IPFS + Pinata', desc: 'Static manifests pinned for retrieval. Decentralized by default.' },
    { badge: 'LICENSE', name: 'MIT', desc: 'Forkable, auditable, no upstream tax. Run your own gateway if you want.' },
  ];
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-num">02 — Foundations</div>
        </div>
        <div>
          <h2 className="section-title">
            Built on <span className="a">the right stack.</span>
          </h2>
        </div>
      </div>
      <div className="int-grid">
        {integrations.map((it, i) => (
          <div className="int-card fade-up hoverable" key={i}>
            <div className="int-badge">{it.badge}</div>
            <div className="int-name">{it.name}</div>
            <div className="int-desc">{it.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Section 03 — Flow
const FlowIcon = ({ kind }) => {
  // Tiny iconography drawn with simple SVG primitives
  const c = 'var(--accent-bright)';
  switch (kind) {
    case 'bot':
      return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="2" stroke={c} strokeWidth="1"/><circle cx="5" cy="7" r="0.8" fill={c}/><circle cx="9" cy="7" r="0.8" fill={c}/></svg>;
    case '402':
      return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke={c} strokeWidth="1"/><path d="M5 5 L9 9 M9 5 L5 9" stroke={c} strokeWidth="1"/></svg>;
    case 'sig':
      return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 9 Q4 6 6 9 T10 9" stroke={c} strokeWidth="1" fill="none"/><circle cx="11" cy="9" r="0.8" fill={c}/></svg>;
    case 'arc':
      return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 11 Q3 3 11 3" stroke={c} strokeWidth="1" fill="none"/><circle cx="11" cy="3" r="1" fill={c}/></svg>;
    case 'ok':
      return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7 L6 10 L11 4" stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    default:
      return null;
  }
};

const FlowSection = () => {
  const [active, setActive] = React.useState(0);
  const steps = [
    { title: 'Bot visits', desc: 'A crawler issues a normal GET against your URL. Headers identify it; no key needed.' },
    { title: '402 returned', desc: 'CrawlPay middleware short-circuits with HTTP 402 + a payment manifest in the body.' },
    { title: 'EIP-191 signed', desc: 'The bot wallet signs the manifest. No gas estimation, no JSON-RPC roundtrip — pure offline.' },
    { title: 'Arc settles', desc: 'The signature posts to Arc. Circle escrow releases USDC into your wallet within a block.' },
    { title: 'Content delivered', desc: '200 OK streams the payload back. The whole exchange completes in under one second.' },
  ];
  const rows = [
    { label: 'REQUESTER', value: 'agent.gpt-4o', icon: 'bot' },
    { label: '402 RESPONSE', value: 'price = $0.001', icon: '402' },
    { label: 'SIGNATURE', value: '0xa7f3…2b1e', icon: 'sig' },
    { label: 'SETTLEMENT', value: 'arc:tx/0x9c…6f', icon: 'arc' },
    { label: '200 OK', value: 'bytes streamed', icon: 'ok' },
  ];

  // Track which step is visible for visual sync
  const stepsRef = React.useRef([]);
  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.dataset.idx);
          setActive(idx);
        }
      });
    }, { threshold: 0.6, rootMargin: '-30% 0px -30% 0px' });
    stepsRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-num">03 — Flow</div>
        </div>
        <div>
          <h2 className="section-title">
            How bots <span className="a">pay autonomously.</span>
          </h2>
        </div>
      </div>
      <div className="flow-grid">
        <div className="flow-steps">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flow-step fade-up ${active === i ? 'active' : ''}`}
              data-idx={i}
              ref={(el) => (stepsRef.current[i] = el)}
              onMouseEnter={() => setActive(i)}
            >
              <div className="flow-num">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div className="flow-title">{s.title}</div>
                <div className="flow-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flow-visual">
          <div className="flow-visual-header">
            <span>handshake.log</span>
            <span style={{ color: 'var(--accent-bright)' }}>live</span>
          </div>
          {rows.map((r, i) => (
            <div className={`flow-row ${active === i ? 'active' : ''}`} key={i}>
              <div className="flow-icon-box"><FlowIcon kind={r.icon} /></div>
              <div className="flow-row-label">{r.label}</div>
              <div className="flow-row-value">{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section 04 — Terminal
const SdkSection = () => (
  <section className="section" id="sdk">
    <div className="section-head">
      <div>
        <div className="section-num">04 — Install</div>
      </div>
      <div>
        <h2 className="section-title">
          Up and running <span className="a">in two minutes.</span>
        </h2>
      </div>
    </div>
    <div className="terminal-wrap fade-up">
      <Terminal />
    </div>
  </section>
);

// CTA
const CtaSection = () => (
  <section className="cta">
    <h2 className="cta-title fade-up">
      The agentic web needs payment rails. <span className="a">Here they are.</span>
    </h2>
    <div className="cta-body fade-up delay-1">
      <p>
        Permissionless. MIT-licensed. Live on Arc Testnet today, mainnet
        when Circle ships. Your content monetized while you sleep.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-primary">Read the spec →</button>
        <a href="https://github.com/divergenttt/CrawlPay-" target="_blank" rel="noopener">
          <button className="btn-outline">Star on GitHub</button>
        </a>
      </div>
      <div className="cta-cap">Arc · Circle · Story · Exa</div>
    </div>
  </section>
);

// Footer
const Footer = () => (
  <footer className="footer">
    <div>CrawlPay · MIT · 2026</div>
    <div className="footer-links">
      <a href="https://github.com/divergenttt/CrawlPay-" target="_blank" rel="noopener">GitHub</a>
      <a href="/dashboard">Dashboard</a>
      <a href="https://github.com/divergenttt/CrawlPay-SDK" target="_blank" rel="noopener">SDK</a>
      <a href="#">Arc</a>
      <a href="#">Story</a>
      <a href="#">Exa</a>
    </div>
  </footer>
);

Object.assign(window, { ModesSection, StackSection, FlowSection, SdkSection, CtaSection, Footer });
