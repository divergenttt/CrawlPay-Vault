"use client";

export function CtaSection() {
  return (
    <section className="cta">
      <div className="cta-grid" aria-hidden="true" />
      <div className="cta-horizon" aria-hidden="true" />
      <div className="cta-scan" aria-hidden="true" />
      <div className="cta-row">
        <h2 className="cta-title fade-up">
          The agentic web needs payment rails.{" "}
          <span className="a">Here they are.</span>
        </h2>
        <div className="cta-body fade-up delay-1">
          <p>Permissionless. MIT-licensed. Your content monetized while you sleep.</p>
          <div className="cta-buttons">
            <a
              href="https://github.com/divergenttt/CrawlPay-SDK"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button type="button" className="btn-primary">
                Read the spec →
              </button>
            </a>
            <a
              href="https://github.com/divergenttt/CrawlPay-"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button type="button" className="btn-outline">
                Star on GitHub
              </button>
            </a>
          </div>
        </div>
      </div>
      <div className="cta-cap fade-up delay-2">Arc · Circle · Story · Exa</div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div>CrawlPay · MIT · 2026</div>
      <div className="footer-links">
        <a href="https://github.com/divergenttt/CrawlPay-" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href="/dashboard" data-page-link>
          Dashboard
        </a>
        <a href="https://github.com/divergenttt/CrawlPay-SDK" target="_blank" rel="noopener noreferrer">
          SDK
        </a>
        <a href="#">Arc</a>
        <a href="#">Story</a>
        <a href="#">Exa</a>
      </div>
    </footer>
  );
}
