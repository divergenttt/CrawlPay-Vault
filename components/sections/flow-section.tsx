"use client";

import { useEffect, useRef, useState } from "react";
import { Orbit } from "@/components/orbit";

export function FlowSection() {
  const [active, setActive] = useState(0);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);

  const steps = [
    { title: "Bot visits", desc: "A crawler issues a normal GET against your URL. Headers identify it; no key needed." },
    { title: "402 returned", desc: "CrawlPay middleware short-circuits with HTTP 402 + a payment manifest in the body." },
    { title: "EIP-191 signed", desc: "The bot wallet signs the manifest. No gas estimation, no JSON-RPC roundtrip — pure offline." },
    { title: "Arc settles", desc: "The signature posts to Arc. Circle escrow releases USDC into your wallet within a block." },
    { title: "Content delivered", desc: "200 OK streams the payload back. The whole exchange completes in under one second." },
  ];

  useEffect(() => {
    const pick = () => {
      const center = window.innerHeight * 0.45;
      let best = 0;
      let bestDist = Infinity;
      stepsRef.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive((cur) => (cur === best ? cur : best));
      rafRef.current = 0;
    };
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(pick);
    };
    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="section" id="flow">
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
              className={`flow-step fade-up ${active === i ? "active" : ""}`}
              ref={(el) => {
                stepsRef.current[i] = el;
              }}
            >
              <div className="flow-num">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className="flow-title">{s.title}</div>
                <div className="flow-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flow-visual">
          <Orbit />
        </div>
      </div>
    </section>
  );
}
