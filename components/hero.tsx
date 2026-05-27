"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
const WebGLShader = dynamic(() => import("@/components/webgl-shader"), {
  ssr: false,
});

export function Hero() {
  return (
    <section className="hero" data-screen-label="Hero">
      <div className="hero-shader-layer" aria-hidden="true">
        <WebGLShader className="hero-shader" />
      </div>
      <div className="hero-frame fade-up" data-faded="in">
        <div className="hero-card">
          <div className="hero-overline">
            <span className="dot" />
            <span>X402 PROTOCOL</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-line">AI bots crawl</span>
            <span className="hero-title-line">your site. Now</span>
            <span className="hero-title-line">
              they <span className="accent">pay for it.</span>
            </span>
          </h1>
          <p className="hero-body">Set it once. Bots pay forever.</p>
          <div className="hero-buttons">
            <a href="https://github.com/divergenttt/CrawlPay-SDK" target="_blank" rel="noopener noreferrer">
              <button type="button" className="btn-primary">
                Start earning →
              </button>
            </a>
            <Link href="/dashboard" data-page-link>
              <button type="button" className="btn-outline">
                Live dashboard
              </button>
            </Link>
          </div>
          <div className="hero-marquee-slot" aria-label="Technology ticker">
            <div className="marquee-wrapper">
              <div className="marquee-track">
                {[...Array(6)].map((_, i) => (
                  <span key={i} className="marquee-item">
                    <span className="marquee-dot">Arc</span>
                    <span className="marquee-dot">Base</span>
                    <span className="marquee-dot">Circle</span>
                    <span className="marquee-dot">Story Protocol</span>
                    <span className="marquee-dot">ElizaOS</span>
                    <span className="marquee-dot">Exa</span>
                    <span className="marquee-dot">x402</span>
                    <span className="marquee-dot">IPFS</span>
                    <span className="marquee-dot">Pinata</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Stats() {
  const items = [
    { num: "2,430", suffix: "+", label: "Transactions on Arc" },
    { num: "11", suffix: "", label: "AI bots supported" },
    { num: "$0.001", suffix: "", label: "Per page crawled" },
    { num: "1s", prefix: "<", label: "Settlement time" },
  ];

  return (
    <section className="stats">
      {items.map((it, i) => (
        <div className="stat hoverable" key={i}>
          <div className="stat-num">
            {it.prefix && <span className="a">{it.prefix}</span>}
            {it.num}
            {it.suffix && <span className="a">{it.suffix}</span>}
          </div>
          <div className="stat-label">{it.label}</div>
        </div>
      ))}
    </section>
  );
}
