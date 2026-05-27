// Dashboard prototype — visualises the same data the real /dashboard would
// fetch from /api/stats, /api/balance, /api/payments. Here the data is mocked
// in-memory but the component shape mirrors the prod TS types so a Next dev
// can drop in real fetches with minimal changes.

// =============================================================================
// Mock data layer (drop-in replaces real fetches in this prototype)
// =============================================================================
const BOTS = [
  { id: 'GPT',  full: 'GPT-4o · OpenAI',     color: '#5e8eff' },
  { id: 'CLD',  full: 'Claude · Anthropic',  color: '#4af0a8' },
  { id: 'PRX',  full: 'Perplexity',          color: '#ff4d63' },
  { id: 'GGO',  full: 'Googlebot',           color: '#ffb86c' },
  { id: 'CCB',  full: 'CCBot · Common Crawl',color: '#9d8fff' },
  { id: 'META', full: 'Meta AI',             color: '#5e8eff' },
  { id: 'BYT',  full: 'Bytespider · ByteDance', color: '#4af0a8' },
  { id: 'ANT',  full: 'Anthropic Crawler',   color: '#4af0a8' },
  { id: 'GEX',  full: 'Gemini Explorer',     color: '#ffb86c' },
  { id: 'CGP',  full: 'ChatGPT-User',        color: '#5e8eff' },
  { id: 'APL',  full: 'Applebot Extended',   color: '#cfcfd6' },
];

const PAGES = [
  '/blog/x402-protocol-explained',
  '/docs/sdk/quickstart',
  '/research/agentic-payments-2025',
  '/p/how-bots-pay-autonomously',
  '/blog/circle-arc-settlement',
  '/docs/api/stats',
  '/research/web-monetization',
  '/p/vault-mode-deep-dive',
  '/blog/the-end-of-robots-txt',
  '/docs/middleware/nextjs',
  '/p/agentic-web-economics',
  '/research/standard-vs-vault',
  '/docs/sdk/express',
  '/p/why-not-paywalls',
  '/blog/eip-191-signing',
];

// Seeded RNG so mock data stays consistent across reloads
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePayments(count = 120) {
  const r = mulberry32(13);
  const now = Date.now();
  const out = [];
  for (let i = 0; i < count; i++) {
    const bot = BOTS[Math.floor(r() * BOTS.length)];
    const page = PAGES[Math.floor(r() * PAGES.length)];
    // Spread over the last ~7 days, weighted toward recent
    const ageMs = Math.pow(r(), 1.6) * 7 * 24 * 3600 * 1000;
    const ts = now - ageMs;
    const hash = Array.from({ length: 64 }, () =>
      Math.floor(r() * 16).toString(16)
    ).join('');
    out.push({
      bot,
      page,
      amount: 0.001,
      hash: '0x' + hash,
      ts,
    });
  }
  return out.sort((a, b) => b.ts - a.ts);
}

const MOCK_PAYMENTS = generatePayments(120);
const TOTAL_REQUESTS = MOCK_PAYMENTS.length + 2310;
const TOTAL_EARNED = (TOTAL_REQUESTS * 0.001).toFixed(3);
const UNIQUE_BOTS = new Set(MOCK_PAYMENTS.map((p) => p.bot.id)).size;
const TODAY_COUNT = MOCK_PAYMENTS.filter(
  (p) => p.ts > Date.now() - 24 * 3600 * 1000
).length;
const TODAY_EARNED = (TODAY_COUNT * 0.001).toFixed(3);

// Build last-7-day buckets for the chart
function buildBuckets() {
  const buckets = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + 24 * 3600 * 1000;
    const count = MOCK_PAYMENTS.filter((p) => p.ts >= start && p.ts < end).length;
    // Bias older days to have more activity so the chart isn't flat
    const padded = i === 0 ? count : count + Math.floor((i + 1) * 1.7);
    buckets.push({
      label: d.toLocaleDateString('en', { weekday: 'short' }).toUpperCase(),
      day: d.getDate(),
      count: padded,
      earned: (padded * 0.001).toFixed(3),
    });
  }
  return buckets;
}
const CHART_DATA = buildBuckets();
const CHART_MAX = Math.max(...CHART_DATA.map((d) => d.count));

// =============================================================================
// UI bits
// =============================================================================
function useClock() {
  const [time, setTime] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function fmtTime(d) {
  return d.toTimeString().slice(0, 8);
}
function fmtAge(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function shortHash(h) {
  return h.slice(0, 6) + '…' + h.slice(-4);
}

const DashboardHeader = () => {
  const t = useClock();
  return (
    <header className="db-header">
      <div className="db-header-left">
        <a href="CrawlPay Landing.html" className="db-brand" data-page-link>
          <LogoMark size={18} color="#fff" />
          <span>CrawlPay</span>
        </a>
        <div className="db-sub">
          <span>Arc Testnet</span>
          <span className="sep">·</span>
          <span>Updated {fmtTime(t)}</span>
        </div>
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

const StatCards = () => {
  const cards = [
    {
      label: 'Total Earned',
      value: (
        <>
          <span className="chrom">$</span>
          {TOTAL_EARNED}
        </>
      ),
      foot: <><span className="pos">+12.4%</span> vs last 7d</>,
    },
    {
      label: 'Total Requests',
      value: TOTAL_REQUESTS.toLocaleString(),
      foot: <><span className="pos">+248</span> last hour</>,
    },
    {
      label: 'Unique Bots',
      value: <>{UNIQUE_BOTS}<span className="chrom">/11</span></>,
      foot: <>across <span className="pos">5 networks</span></>,
    },
    {
      label: 'Today',
      value: (
        <>
          <span className="chrom">$</span>
          {TODAY_EARNED}
        </>
      ),
      foot: <>{TODAY_COUNT} requests today</>,
    },
  ];
  return (
    <div className="db-grid-4">
      {cards.map((c, i) => (
        <div className="db-card" key={i}>
          <div className="db-card-label">{c.label}</div>
          <div className="db-card-value">{c.value}</div>
          <div className="db-card-foot">{c.foot}</div>
        </div>
      ))}
    </div>
  );
};

const BalanceCards = () => {
  // Mocked balances — real impl would loading-guard with "—"
  const gatewayAvailable = '4.872';
  const walletBalance = '12.413';
  return (
    <div className="db-grid-2">
      <div className="db-card">
        <div className="db-card-label">Gateway Available</div>
        <div className="db-card-value">
          <span className="chrom">$</span>
          {gatewayAvailable}
        </div>
        <div className="db-card-foot">Ready to settle to wallet</div>
      </div>
      <div className="db-card">
        <div className="db-card-label">Wallet Balance</div>
        <div className="db-card-value">
          <span className="grn">$</span>
          {walletBalance}
        </div>
        <div className="db-card-foot">USDC · 0x9a4f…c021</div>
      </div>
    </div>
  );
};

const Chart = () => {
  const W = 1200, H = 240;
  const PAD = { l: 56, r: 16, t: 20, b: 30 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const n = CHART_DATA.length;
  const slot = innerW / n;
  const barW = Math.min(56, slot * 0.55);

  // Y-axis tick values
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((CHART_MAX / ticks) * i)
  );

  return (
    <section className="db-chart">
      <div className="db-chart-head">
        <div className="db-chart-title">Revenue · Last 7 Days</div>
        <div className="db-chart-sub">USD · per page · arc testnet</div>
      </div>
      <svg className="db-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="bar-grad-hot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4d63" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5e8eff" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* grid lines */}
        {tickVals.map((v, i) => {
          const y = PAD.t + innerH - (v / CHART_MAX) * innerH;
          return (
            <g key={i}>
              <line
                x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
                className="db-grid-line"
              />
              <text
                x={PAD.l - 12} y={y + 4}
                className="db-axis-text"
                textAnchor="end"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* bars */}
        {CHART_DATA.map((d, i) => {
          const cx = PAD.l + slot * i + slot / 2;
          const h = (d.count / CHART_MAX) * innerH;
          const x = cx - barW / 2;
          const y = PAD.t + innerH - h;
          const isToday = i === CHART_DATA.length - 1;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={barW} height={h}
                className="db-bar"
                style={{ fill: isToday ? 'url(#bar-grad-hot)' : 'url(#bar-grad)' }}
                rx={4} ry={4}
              />
              <text
                x={cx} y={y - 8}
                className="db-bar-label"
                textAnchor="middle"
              >
                {d.count}
              </text>
              <text
                x={cx} y={H - 10}
                className="db-axis-text"
                textAnchor="middle"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
};

const PaymentsTable = () => {
  const rows = MOCK_PAYMENTS.slice(0, 100);
  return (
    <section className="db-table-wrap">
      <div className="db-table-head">
        <div className="db-table-title">Recent Payments</div>
        <div className="db-table-sub">last {rows.length} · live · arc testnet</div>
      </div>
      <div className="db-table-scroll">
        <table className="db-table">
          <thead>
            <tr>
              <th>Bot</th>
              <th>Page</th>
              <th>Amount</th>
              <th>Tx Hash</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={i}>
                <td>
                  <span className="cell-bot">
                    <span className="bot-dot" style={{ background: p.bot.color, boxShadow: `0 0 6px ${p.bot.color}` }}></span>
                    {p.bot.full}
                  </span>
                </td>
                <td><div className="cell-page">{p.page}</div></td>
                <td>
                  <span className="cell-amount">
                    <span className="chrom">$</span>{p.amount.toFixed(3)}
                  </span>
                </td>
                <td>
                  <a
                    className="cell-tx"
                    href={`https://testnet.arcscan.app/tx/${p.hash}`}
                    target="_blank"
                    rel="noopener"
                  >
                    {shortHash(p.hash)}
                    <span className="arrow">↗</span>
                  </a>
                </td>
                <td><span className="cell-time">{fmtAge(p.ts)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

function DashboardApp() {
  useCursor();
  return (
    <React.Fragment>
      <div className="cursor-ring"></div>
      <div className="cursor-dot"></div>
      <main className="db-shell">
        <DashboardHeader />
        <StatCards />
        <BalanceCards />
        <Chart />
        <PaymentsTable />
      </main>
    </React.Fragment>
  );
}

const dbRoot = ReactDOM.createRoot(document.getElementById('root'));
dbRoot.render(<DashboardApp />);
