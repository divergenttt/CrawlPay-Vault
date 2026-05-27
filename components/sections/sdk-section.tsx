"use client";

import { Terminal } from "@/components/terminal";

export function SdkSection() {
  return (
    <section className="section" id="sdk">
      <div className="section-head section-head-sdk">
        <div>
          <div className="section-num">04 — Install</div>
        </div>
        <div className="section-head-sdk-title">
          <h2 className="section-title section-title-nowrap">
            Up and running <span className="a">in two minutes.</span>
          </h2>
        </div>
      </div>
      <div className="terminal-wrap fade-up">
        <Terminal />
      </div>
    </section>
  );
}
