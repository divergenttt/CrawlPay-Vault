"use client";

import Link from "next/link";

const CONNECT_WAYS = [
  {
    title: "MCP & Plugins",
    desc: "Use our MCP server or ElizaOS plugin. Your agent pays automatically with an API key.",
    href: "/connect/ai-agents",
    dotClass: "ai",
  },
  {
    title: "API Keys",
    desc: "Create spending tokens with per-request and daily limits. Fund once, agents pay forever.",
    href: "/connect/api-keys",
    dotClass: "api",
  },
  {
    title: "Web SDK",
    desc: "Add CrawlPay to your site in 2 minutes.",
    href: "/connect/web-sdk",
    dotClass: "web",
  },
] as const;

export function ConnectWaysSection() {
  return (
    <section className="section" id="connect">
      <div className="section-head">
        <div>
          <div className="section-num">04 — Connect</div>
        </div>
        <div>
          <h2 className="section-title">
            Three ways to <span className="a">connect.</span>
          </h2>
        </div>
      </div>
      <div className="int-grid connect-ways-grid">
        {CONNECT_WAYS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="int-card connect-way-card fade-up hoverable"
            data-page-link
          >
            <div className={`connect-way-dot ${item.dotClass}`} aria-hidden="true" />
            <div className="int-name">{item.title}</div>
            <div className="int-desc">{item.desc}</div>
            <div className="connect-way-link">→ {item.href}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
