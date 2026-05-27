// =============================================================================
// CrawlPay · Connect → API Keys
// Generate and manage secret tokens that authorise an AI agent against the
// CrawlPay payment network.
// =============================================================================

const LogoMark = ({ size = 18, color = '#fff' }) =>
<svg className="logo-hex" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 3 L3 12 L7 21 L11 21 L11 18 L8 18 L5 12 L8 6 L11 6 L11 3 Z" fill={color} />
    <path d="M17 3 L21 12 L17 21 L13 21 L13 18 L16 18 L19 12 L16 6 L13 6 L13 3 Z" fill={color} />
  </svg>;

const ConnectHeader = () =>
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
  </header>;


// ----------------------------------------------------------------------------
// Token generator (cosmetic — produces deterministic-looking hex)
// ----------------------------------------------------------------------------
function randomHex(len) {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}
function newToken() {
  // Format: cr_live_<32 hex>
  return 'cr_live_' + randomHex(32);
}
function mask(t) {
  // cr_live_••••••••••••••••••••4a2b  (preserve prefix + last 4)
  if (!t) return '';
  const head = t.slice(0, 8); // cr_live_
  const tail = t.slice(-4);
  return head + '••••••••••••••••••••' + tail;
}

// ----------------------------------------------------------------------------
// Initial seed data
// ----------------------------------------------------------------------------
const SEED = [
{ id: 'k1', name: 'Eliza_Bot_Main', token: 'cr_live_8d7c1a4e92b6f0a3c8e4d1f29b5a4a2b', perReq: '0.01', daily: '0.50', created: '26.05.2026', status: 'active' },
{ id: 'k2', name: 'Claude_Desktop', token: 'cr_live_3a5f7b1c9e2d8a4f0c6b1d2e3f47e3c1', perReq: '0.005', daily: '0.25', created: '14.05.2026', status: 'active' },
{ id: 'k3', name: 'Research_Worker', token: 'cr_live_2c4e6f8a0b1d3e5f7a9c1e2d3f4ab8d2', perReq: '0.02', daily: '1.00', created: '02.05.2026', status: 'paused' },
{ id: 'k4', name: 'CI_Eliza_Staging', token: 'cr_live_9b1e4f8c2a3d6e0f5a7b9c1d3e5f7d1a', perReq: '0.001', daily: '0.10', created: '11.04.2026', status: 'revoked' }];


const STATUS_META = {
  active: { label: '✓ Active', cls: 'active' },
  paused: { label: '○ Paused', cls: 'paused' },
  revoked: { label: '× Revoked', cls: 'revoked' }
};

const COLOR_FOR = (i) => ['#4af0a8', '#5e8eff', '#ff4d63', '#ffb86c', '#9d8fff'][i % 5];

// ----------------------------------------------------------------------------
// Single key row
// ----------------------------------------------------------------------------
function KeyRow({ row, index, onDelete, justCreatedId }) {
  const isFresh = justCreatedId === row.id;
  const [shown, setShown] = React.useState(isFresh);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isFresh) setShown(true);
  }, [isFresh]);

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(row.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const status = STATUS_META[row.status] || STATUS_META.active;

  return (
    <div className={'kx-row body' + (isFresh ? ' fresh' : '')}>
      <div className="kx-name">
        <span className="botdot" style={{ background: COLOR_FOR(index), boxShadow: `0 0 8px ${COLOR_FOR(index)}` }}></span>
        <span className="kx-name-stack">
          <span className="kx-name-label">{row.name}</span>
          <span className="kx-token-mini">
            <span className="tok">{shown ? row.token : mask(row.token)}</span>
            <button
              type="button"
              className="iconbtn xs"
              aria-label={shown ? 'Hide token' : 'Show token'}
              onClick={() => setShown((v) => !v)}>
              
              {shown ?
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8s2.4-4 6-4 6 4 6 4-2.4 4-6 4-6-4-6-4Z" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg> :

              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8s2.4-4 6-4 6 4 6 4-2.4 4-6 4-6-4-6-4Z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              }
            </button>
            <button
              type="button"
              className={'iconbtn xs' + (copied ? ' copied' : '')}
              aria-label="Copy token"
              onClick={copy}>
              
              {copied ?
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg> :

              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              }
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
        <span className={'kx-status ' + status.cls}>
          <span className="pulse"></span>
          {status.label}
        </span>
      </div>
      <div>
        <button
          type="button"
          className="kx-delete"
          aria-label="Delete key"
          onClick={() => onDelete(row.id)}>
          
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M3 4h10M6 4V2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V4M4.5 4l.7 9.1a1 1 0 0 0 1 .9h3.6a1 1 0 0 0 1-.9L11.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>);

}

// ----------------------------------------------------------------------------
// App
// ----------------------------------------------------------------------------
function KeysApp() {
  useCursor();
  const [rows, setRows] = React.useState(SEED);
  const [toast, setToast] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [justCreatedId, setJustCreatedId] = React.useState(null);

  // Form state
  const [fName, setFName] = React.useState('');
  const [fPerReq, setFPerReq] = React.useState('0.01');
  const [fDaily, setFDaily] = React.useState('0.50');
  const [fError, setFError] = React.useState('');

  const openModal = () => {
    setFName('');
    setFPerReq('0.01');
    setFDaily('0.50');
    setFError('');
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // Close on Esc
  React.useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => {if (e.key === 'Escape') closeModal();};
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const submit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const name = fName.trim() || 'New_Agent_Key_' + (rows.length + 1);
    const pr = parseFloat(fPerReq);
    const dl = parseFloat(fDaily);
    if (isNaN(pr) || pr <= 0) {setFError('Max per request must be a positive number.');return;}
    if (isNaN(dl) || dl <= 0) {setFError('Daily limit must be a positive number.');return;}
    if (dl < pr) {setFError('Daily limit cannot be less than per-request limit.');return;}

    const fresh = {
      id: 'k' + Date.now(),
      name: name.replace(/\s+/g, '_'),
      token: newToken(),
      perReq: pr.toFixed(pr < 0.01 ? 3 : 2),
      daily: dl.toFixed(dl < 0.01 ? 3 : 2),
      created: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
      status: 'active'
    };
    setRows([fresh, ...rows]);
    setJustCreatedId(fresh.id);
    setToast('New key created · copy it now');
    setTimeout(() => setToast(null), 2600);
    setTimeout(() => setJustCreatedId(null), 4500);
    setModalOpen(false);
  };

  const remove = (id) => setRows((r) => r.filter((k) => k.id !== id));

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
              <span className="pip" style={{ background: 'var(--c-blu)', boxShadow: '0 0 8px var(--c-blu)' }}></span>
              {rows.filter((r) => r.status === 'active').length} active keys · Base mainnet
            </div>
            <h1 className="cn-title">A secret PIN <em>for your agents.</em></h1>
          </div>
          <p className="cn-lede">
            Create a secure token to authorise your AI agent. You stay fully in control
            of the bot's budget: every payment is signed by your wallet (FaceID-gated)
            and capped by hard daily limits you choose at creation time.
          </p>
        </section>

        {/* Generate CTA */}
        <section className="kx-cta">
          <div>
            <div className="kx-cta-title">Create a key for your bot</div>
            <div className="kx-cta-sub" style={{ fontFamily: "\"DM Sans\"" }}>
              Set a name and two spending limits — per request and per day. 
              <span style={{ fontFamily: '"DM Sans"', fontStyle: 'normal' }}>
                <br /><br />
                This key works with any integration: the ElizaOS plugin, a local MCP server (Claude Desktop, Cursor), as well as custom Python/TypeScript scripts via the CrawlPay API.
              </span>
            </div>
          </div>
          <button type="button" className="kx-generate" onClick={openModal}>
            <span className="plus">+</span>
            Generate new API Key
          </button>
        </section>

        {/* Table */}
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
              <div></div>
            </div>
            {rows.map((r, i) => <KeyRow key={r.id} row={r} index={i} onDelete={remove} justCreatedId={justCreatedId} />)}
          </div>

          {/* Warning */}
          <div className="kx-warn">
            <div className="kx-warn-icon">!</div>
            <div className="kx-warn-body">
              <strong>Keep your API key private.</strong>{' '}
              Never share it with third parties or push it to public repos like{' '}
              <code>GitHub</code>. Any agent holding this key can spend from your
              balance to unlock paid content — treat it like a hot-wallet seed.
            </div>
          </div>
        </section>

        <div className="cn-foot">
          <span>Connect · API Keys · {rows.length} on file</span>
          <span><a href="CrawlPay Web SDK.html" data-page-link>↗ Continue to Web SDK</a></span>
        </div>
      </main>

      {/* Toast */}
      <div className={'kx-toast' + (toast ? ' on' : '')}>
        <span className="checkdot"></span>
        {toast}
      </div>

      {/* Modal */}
      {modalOpen && <div className="kx-modal-wrap" onMouseDown={(e) => {if (e.target === e.currentTarget) closeModal();}}>
          <div className="kx-modal" role="dialog" aria-modal="true" aria-label="Create API key">
            <button type="button" className="kx-modal-close" aria-label="Close" onClick={closeModal}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <div className="kx-modal-eyebrow">
              <span className="pip" style={{ background: 'var(--c-blu)', boxShadow: '0 0 8px var(--c-blu)' }}></span>
              New API key
            </div>
            <h3 className="kx-modal-title">Set a budget for the bot</h3>
            <p className="kx-modal-sub">
              Limits enforce spending on-chain before the transaction is signed. The
              agent can never exceed them, even if the key leaks.
            </p>

            <form className="kx-form" onSubmit={submit}>
              <label className="kx-field">
                <span className="kx-field-label">Name</span>
                <input
                type="text"
                placeholder="e.g. Eliza_Bot_Main"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                autoFocus />
              
                <span className="kx-field-hint">Only you see this — used to identify the agent in receipts.</span>
              </label>

              <div className="kx-field-row">
                <label className="kx-field">
                  <span className="kx-field-label">Max per request</span>
                  <span className="kx-field-input-with-suffix">
                    <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={fPerReq}
                    onChange={(e) => setFPerReq(e.target.value)} />
                  
                    <span className="suffix">USDC</span>
                  </span>
                  <span className="kx-field-hint">Single-call ceiling. Typical: 0.001–0.01.</span>
                </label>

                <label className="kx-field">
                  <span className="kx-field-label">Daily limit</span>
                  <span className="kx-field-input-with-suffix">
                    <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={fDaily}
                    onChange={(e) => setFDaily(e.target.value)} />
                  
                    <span className="suffix">USDC / day</span>
                  </span>
                  <span className="kx-field-hint">Rolling 24h cap. Resets at 00:00 UTC.</span>
                </label>
              </div>

              {fError && <div className="kx-form-error">{fError}</div>}

              <div className="kx-form-actions">
                <button type="button" className="kx-btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="kx-generate compact">
                  <span className="plus">+</span>
                  Create key
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </React.Fragment>);

}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<KeysApp />);