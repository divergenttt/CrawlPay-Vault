"use client";

export function ProtocolSection() {
  const cards = [
    {
      label: "STANDARD · X402",
      title: "Public pages, metered.",
      body: "A 402 Payment Required handshake replaces robots.txt. Any crawler that handles HTTP correctly can stream your content - and pay per request.",
      code: "GET /article  →  402 → 200 OK",
    },
    {
      label: "VAULT · STORY CDR",
      title: "Private encrypted datasets.",
      body: "Wrap proprietary corpora with Confidential Data Rooms. Only paying agents holding a signed grant can decrypt. Revoke any time.",
      code: "uploadVault(dataset) → uuid: 2224",
    },
    {
      label: "SEARCH · EXA",
      title: "Full autonomous loop.",
      body: "Agents query, pay, retrieve, and cite - without a human in the chain. Indexed by Exa, settled by Circle, no rate limits.",
      code: "exa.search({ budget: 0.10 })",
    },
    {
      label: "SDK · 2 MINUTES",
      title: "One package, any framework.",
      body: "Drop-in middleware for Next.js and Express.\nCloudflare Workers coming soon.",
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
}
