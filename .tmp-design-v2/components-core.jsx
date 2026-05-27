// Reusable parts: logo mark, nav, orbit, terminal code

const LogoMark = ({ size = 18, color = 'var(--accent)' }) =>
<svg className="logo-hex" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 3 L3 12 L7 21 L11 21 L11 18 L8 18 L5 12 L8 6 L11 6 L11 3 Z" fill={color} />
    <path d="M17 3 L21 12 L17 21 L13 21 L13 18 L16 18 L19 12 L16 6 L13 6 L13 3 Z" fill={color} />
  </svg>;


const Nav = () => {
  const scrolled = useScrolled(40);
  const [active, setActive] = React.useState('');

  // Watch which section is in view to highlight the matching nav link
  React.useEffect(() => {
    const ids = ['protocol', 'flow', 'sdk'];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const scrollTo = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const links = [
  { id: 'protocol', label: 'Protocol' },
  { id: 'flow', label: 'Flow' },
  { id: 'sdk', label: 'SDK' }];


  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-left">
        <a href="#" className="nav-logo" onClick={(e) => {e.preventDefault();window.scrollTo({ top: 0, behavior: 'smooth' });}}>
          <LogoMark size={18} color="var(--accent-bright)" />
          <span>CrawlPay</span>
        </a>
      </div>
      <div className="nav-center">
        <div className="nav-links">
          {links.map((l) =>
          <a
            key={l.id}
            href={`#${l.id}`}
            className={active === l.id ? 'active' : ''}
            onClick={(e) => scrollTo(e, l.id)}>
            
              {l.label}
            </a>
          )}
          <div className="nav-dropdown">
            <button type="button" className="nav-dropdown-trigger" aria-haspopup="true">
              Connect
              <svg className="caret" width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
                <path d="M1 1L4.5 4.5L8 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="nav-dropdown-menu" role="menu">
              <div className="nav-dropdown-menu-inner">
                <a href="CrawlPay AI Agents.html" data-page-link role="menuitem">
                  <span className="dot" style={{ background: 'var(--c-grn)', boxShadow: '0 0 8px var(--c-grn)' }}></span>
                  AI Agents
                </a>
                <a href="CrawlPay API Keys.html" data-page-link role="menuitem">
                  <span className="dot" style={{ background: 'var(--c-blu)', boxShadow: '0 0 8px var(--c-blu)' }}></span>
                  API Keys
                </a>
                <a href="CrawlPay Web SDK.html" data-page-link role="menuitem">
                  <span className="dot" style={{ background: 'var(--c-red)', boxShadow: '0 0 8px var(--c-red)' }}></span>
                  Web SDK
                </a>
              </div>
            </div>
          </div>
          <a
            href="https://github.com/divergenttt/CrawlPay-"
            target="_blank"
            rel="noopener">
            
            GitHub ↗
          </a>
        </div>
      </div>
      <div className="nav-right">
        <a href="CrawlPay Dashboard.html" className="nav-cta" data-page-link>Dashboard</a>
      </div>
    </nav>);

};

// =============================================================================
// Orbit visual — solar-system: each AI bot is an independent planet with its
// own orbit radius, speed, direction, comet trail. Central sun = the paywall.
// =============================================================================
const SOLAR_SIZE = 560;
const SOLAR_CENTER = SOLAR_SIZE / 2;

const PLANETS = [
// r=110 — solo
{ id: 'GPT', r: 110, dur: 9, size: 11, dir: 1, start: 20, tint: '#c9c0ff', label: 'GPT', spin: 3.0, trail: 100 },

// r=144 — pair (180° apart, same speed/direction so they stay diametrically opposed)
{ id: 'CGP', r: 144, dur: 14, size: 9, dir: -1, start: 90, tint: '#a89bff', label: 'CGP', spin: 4.0, trail: 100 },
{ id: 'CLD', r: 144, dur: 14, size: 8, dir: -1, start: 270, tint: '#9d8fff', label: 'CLD', spin: 3.6, trail: 100 },

// r=180 — pair
{ id: 'ANT', r: 180, dur: 19, size: 7, dir: 1, start: 200, tint: '#7b6ef6', label: 'ANT', spin: 2.4, trail: 100 },
{ id: 'PRX', r: 180, dur: 19, size: 9, dir: 1, start: 20, tint: '#b3a8ff', label: 'PRX', spin: 4.6, trail: 100 },

// r=214 — trio (120° apart)
{ id: 'GGO', r: 214, dur: 25, size: 12, dir: -1, start: 35, tint: '#9d8fff', label: 'GGO', spin: 5.0, trail: 78 },
{ id: 'GEX', r: 214, dur: 25, size: 8, dir: -1, start: 155, tint: '#8a7df0', label: 'GEX', spin: 3.6, trail: 78 },
{ id: 'CCB', r: 214, dur: 25, size: 9, dir: -1, start: 275, tint: '#a89bff', label: 'CCB', spin: 4.2, trail: 78 },

// r=248 — outer trio
{ id: 'BYT', r: 248, dur: 36, size: 10, dir: 1, start: 10, tint: '#b3a8ff', label: 'BYT', spin: 4.6, trail: 78 },
{ id: 'META', r: 248, dur: 36, size: 9, dir: 1, start: 130, tint: '#c9c0ff', label: 'META', spin: 3.4, trail: 78 },
{ id: 'APL', r: 248, dur: 36, size: 8, dir: 1, start: 250, tint: '#9d8fff', label: 'APL', spin: 3.8, trail: 78 }];


// Deterministic starfield (no flicker on re-render)
const STARS = (() => {
  const out = [];
  let s = 7;
  const rand = () => {s = (s * 9301 + 49297) % 233280;return s / 233280;};
  for (let i = 0; i < 90; i++) {
    out.push({
      x: rand() * SOLAR_SIZE,
      y: rand() * SOLAR_SIZE,
      r: 0.35 + rand() * 1.1,
      o: 0.18 + rand() * 0.55,
      dur: 2 + rand() * 4,
      delay: -rand() * 4
    });
  }
  return out;
})();

const Orbit = () => {
  const cx = SOLAR_CENTER,cy = SOLAR_CENTER;

  return (
    <div className="orbit-wrap" style={{ width: SOLAR_SIZE, height: SOLAR_SIZE }}>
      <svg
        width={SOLAR_SIZE}
        height={SOLAR_SIZE}
        viewBox={`0 0 ${SOLAR_SIZE} ${SOLAR_SIZE}`}
        style={{ position: 'absolute', inset: 0, display: 'block' }}>
        
        <defs>
          <radialGradient id="sun-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sun-corona" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="planet-grad" cx="32%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#c8c8d0" />
            <stop offset="100%" stopColor="#2a2a35" />
          </radialGradient>
          <filter id="head-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* starfield */}
        {STARS.map((s, i) =>
        <circle key={`st-${i}`} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o}>
            <animate
            attributeName="opacity"
            values={`${s.o};${(s.o * 0.25).toFixed(2)};${s.o}`}
            dur={`${s.dur}s`}
            begin={`${s.delay}s`}
            repeatCount="indefinite" />
          
          </circle>
        )}

        {/* orbit guide circles (deduped) */}
        {Array.from(new Set(PLANETS.map((p) => p.r))).map((r) =>
        <circle
          key={`orb-${r}`}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeDasharray="1.5 5" />

        )}

        {/* corona aura */}
        <circle cx={cx} cy={cy} r={102} fill="url(#sun-corona)" />

        {/* expanding sun ripples */}
        {[0, 1.5, 3.0].map((delay, i) =>
        <circle
          key={`rip-${i}`}
          cx={cx} cy={cy} r="52"
          fill="none"
          stroke="#ffffff"
          opacity="0">
          
            <animate attributeName="r" values="52;104" dur="4.5s" begin={`${delay}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0" dur="4.5s" begin={`${delay}s`} repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="1.4;0.3" dur="4.5s" begin={`${delay}s`} repeatCount="indefinite" />
          </circle>
        )}

        {/* planets with comet trails, each on its own animated rotating group */}
        {PLANETS.map((p) => {
          const C = 2 * Math.PI * p.r;
          const T_LONG = p.trail || 100;
          const T_MID = T_LONG * 0.6;
          const T_HEAD = T_LONG * 0.22;
          const L_long = T_LONG / 360 * C;
          const L_mid = T_MID / 360 * C;
          const L_head = T_HEAD / 360 * C;

          // For dir=+1: planet sits at angle T_LONG; trails extend backward to angle 0
          // For dir=-1: planet sits at angle 0; trails extend forward to angle T_LONG
          const planetDeg = p.dir === 1 ? T_LONG : 0;
          const offMid = p.dir === 1 ? -((T_LONG - T_MID) / 360) * C : 0;
          const offHead = p.dir === 1 ? -((T_LONG - T_HEAD) / 360) * C : 0;

          const rad = planetDeg * Math.PI / 180;
          const px = cx + p.r * Math.cos(rad);
          const py = cy + p.r * Math.sin(rad);

          const fromAng = p.start;
          const toAng = p.start + 360 * p.dir;
          const labFrom = -p.start;
          const labTo = -p.start - 360 * p.dir;

          return (
            <g key={`pl-${p.id}`}>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`${fromAng} ${cx} ${cy}`}
                to={`${toAng} ${cx} ${cy}`}
                dur={`${p.dur}s`}
                repeatCount="indefinite" />
              

              {/* uniform trail — single arc, one color, no fading layers */}
              <circle
                cx={cx} cy={cy} r={p.r}
                fill="none" stroke="#ffffff" strokeWidth="1"
                strokeDasharray={`${L_long} ${C - L_long}`}
                strokeDashoffset={0}
                opacity="0.32"
                strokeLinecap="round" />
              

              {/* planet + counter-rotating label */}
              <g transform={`translate(${px.toFixed(2)},${py.toFixed(2)})`}>
                <circle r={p.size + 8} fill={p.tint} opacity="0.18" />
                <circle r={p.size + 3} fill={p.tint} opacity="0.28" filter="url(#head-glow)" />

                {/* axial self-spin — highlight rotates around planet center */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur={`${p.spin}s`}
                    repeatCount="indefinite" />
                  
                  <circle r={p.size} fill="url(#planet-grad)" stroke={p.tint} strokeWidth="0.6" />
                  {/* subtle highlight crescent — appears to spin around the planet */}
                  <ellipse cx={-p.size * 0.35} cy={-p.size * 0.35} rx={p.size * 0.32} ry={p.size * 0.22} fill="white" opacity="0.45" />
                  <ellipse cx={p.size * 0.45} cy={p.size * 0.35} rx={p.size * 0.18} ry={p.size * 0.12} fill="#1a1a2e" opacity="0.35" />
                </g>

                {p.label &&
                <g>
                    <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`${labFrom}`}
                    to={`${labTo}`}
                    dur={`${p.dur}s`}
                    repeatCount="indefinite" />
                  
                    <text
                    x="0" y={p.size + 14}
                    textAnchor="middle"
                    fontFamily="'DM Mono', ui-monospace, monospace"
                    fontSize="9"
                    fill="#cfcfd6"
                    style={{ letterSpacing: '0.1em' }}>
                    
                      {p.label}
                    </text>
                  </g>
                }
              </g>
            </g>);

        })}

        {/* central sun (paywall) */}
        <g transform={`translate(${cx},${cy})`}>
          {/* outer corona */}
          <circle r="78" fill="url(#sun-core)" opacity="0.5" filter="url(#sun-glow)">
            <animate attributeName="r" values="74;84;74" dur="4s" repeatCount="indefinite" />
          </circle>
          {/* inner blaze */}
          <circle r="56" fill="url(#sun-core)">
            <animate attributeName="opacity" values="0.85;1;0.85" dur="2.6s" repeatCount="indefinite" />
          </circle>
          {/* chip core */}
          <circle r="53" fill="#000000" stroke="#ffffff" strokeWidth="1.4">
            <animate attributeName="stroke-width" values="1.2;2;1.2" dur="3s" repeatCount="indefinite" />
          </circle>
          <text
            x="0" y="6"
            textAnchor="middle"
            fontFamily="'DM Mono', ui-monospace, monospace"
            fontSize="17"
            fontWeight="500"
            fill="#ffffff"
            style={{ letterSpacing: '0.02em' }}>
            
            $0.001
          </text>
        </g>
      </svg>
      <div className="orbit-caption">11 AI crawlers · orbiting your paywall</div>
    </div>);

};

const Hero = () =>
<section className="hero" data-screen-label="Hero">
    <WebGLShader className="hero-shader" />
    <div className="hero-frame fade-up">
      <div className="hero-card">
        <div className="overline">
          <span className="dot"></span>
          <span>X402 PROTOCOL</span>
        </div>
        <h1 className="hero-title">
          AI bots crawl your site. Now they <span className="accent">pay for it.</span>
        </h1>
        <p className="hero-body">Set it once. Bots pay forever.

      </p>
        <div className="hero-buttons">
          <button className="btn-primary">Start earning →</button>
          <a href="CrawlPay Dashboard.html" data-page-link>
            <button className="btn-outline">Live dashboard</button>
          </a>
        </div>
      </div>
    </div>
  </section>;


const Stats = () => {
  const items = [
  { num: '2,430', suffix: '+', label: 'Transactions on Arc' },
  { num: '11', suffix: '', label: 'AI bots supported' },
  { num: '$0.001', suffix: '', label: 'Per page crawled' },
  { num: '1s', prefix: '<', label: 'Settlement time' }];

  return (
    <section className="stats">
      {items.map((it, i) =>
      <div className="stat hoverable" key={i}>
          <div className="stat-num">
            {it.prefix && <span className="a">{it.prefix}</span>}
            {it.num}
            {it.suffix && <span className="a">{it.suffix}</span>}
          </div>
          <div className="stat-label">{it.label}</div>
        </div>
      )}
    </section>);

};

// Terminal code block
const Terminal = () => {
  return (
    <div className="terminal">
      <div className="terminal-bar">
        <div className="terminal-dots">
          <span className="terminal-dot" style={{ background: '#ff5f57' }}></span>
          <span className="terminal-dot" style={{ background: '#febc2e' }}></span>
          <span className="terminal-dot" style={{ background: '#28c840' }}></span>
        </div>
        <span className="terminal-filename">middleware.ts</span>
      </div>
      <div className="terminal-body">
        <span className="line"><span className="tok-comment">{'// 1. install once'}</span></span>
        <span className="line"><span className="tok-plain">$ </span><span className="tok-keyword">npm install</span><span className="tok-plain"> </span><span className="tok-string">@crawlpay/sdk</span></span>
        <span className="line">{' '}</span>
        <span className="line"><span className="tok-comment">{'// 2. wrap any route'}</span></span>
        <span className="line"><span className="tok-keyword">import</span><span className="tok-plain"> {'{ crawlpay }'} </span><span className="tok-keyword">from</span><span className="tok-plain"> </span><span className="tok-string">'@crawlpay/sdk'</span></span>
        <span className="line">{' '}</span>
        <span className="line"><span className="tok-keyword">export const</span><span className="tok-plain"> middleware = </span><span className="tok-fn">crawlpay</span><span className="tok-plain">({'{'}</span></span>
        <span className="line"><span className="tok-plain">{'  '}</span><span className="tok-prop">price</span><span className="tok-plain">: </span><span className="tok-string">'0.001'</span><span className="tok-plain">,</span></span>
        <span className="line"><span className="tok-plain">{'  '}</span><span className="tok-prop">network</span><span className="tok-plain">: </span><span className="tok-string">'arcTestnet'</span><span className="tok-plain">,</span></span>
        <span className="line"><span className="tok-plain">{'  '}</span><span className="tok-prop">wallet</span><span className="tok-plain">: </span><span className="tok-string">'0x9a4f...c021'</span><span className="tok-plain">,</span></span>
        <span className="line"><span className="tok-plain">{'  '}</span><span className="tok-prop">mode</span><span className="tok-plain">: </span><span className="tok-string">'standard'</span><span className="tok-plain">,</span></span>
        <span className="line"><span className="tok-plain">{'})'}</span></span>
        <span className="line">{' '}</span>
        <span className="line"><span className="tok-comment">{'// 3. ship. bots will figure it out.'}</span><span className="cursor-blink"></span></span>
      </div>
    </div>);

};

Object.assign(window, { LogoMark, Nav, Orbit, Hero, Stats, Terminal });