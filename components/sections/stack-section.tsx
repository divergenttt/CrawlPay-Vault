"use client";

export function StackSection() {
  const integrations = [
    { badge: "PAYMENTS", name: "Base + Circle", desc: "USDC settlement on Base Mainnet. Final in seconds, gas paid by the agent." },
    { badge: "PROTOCOL", name: "x402", desc: "HTTP 402 reborn. Wallet-signed receipts, no API keys to leak." },
    { badge: "PRIVACY", name: "Story CDR", desc: "Confidential Data Rooms. Hold keys, not user data - provable revocation." },
    { badge: "SEARCH", name: "Exa", desc: "Indexed by intent, not by spam. Agents reach you because you matter." },
    { badge: "STORAGE", name: "IPFS + Pinata", desc: "Static manifests pinned for retrieval. Decentralized by default." },
    { badge: "LICENSE", name: "MIT", desc: "Forkable, auditable, no upstream tax. Run your own gateway if you want." },
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
}
