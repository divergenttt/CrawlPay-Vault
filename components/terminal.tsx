"use client";

export function Terminal() {
  return (
    <div className="terminal">
      <div className="terminal-bar">
        <div className="terminal-dots">
          <span
            className="terminal-dot"
            style={{ background: "#ff5f57" }}
          />
          <span
            className="terminal-dot"
            style={{ background: "#febc2e" }}
          />
          <span
            className="terminal-dot"
            style={{ background: "#28c840" }}
          />
        </div>
        <span className="terminal-filename">middleware.ts</span>
      </div>
      <div className="terminal-body">
        <span className="line">
          <span className="tok-comment">{"// 1. install once"}</span>
        </span>
        <span className="line">
          <span className="tok-plain">$ </span>
          <span className="tok-keyword">npm install</span>
          <span className="tok-plain"> </span>
          <span className="tok-string">@crawlpay/sdk</span>
        </span>
        <span className="line"> </span>
        <span className="line">
          <span className="tok-comment">{"// 2. wrap any route"}</span>
        </span>
        <span className="line">
          <span className="tok-keyword">import</span>
          <span className="tok-plain"> {"{ crawlpay }"} </span>
          <span className="tok-keyword">from</span>
          <span className="tok-plain"> </span>
          <span className="tok-string">&apos;@crawlpay/sdk&apos;</span>
        </span>
        <span className="line"> </span>
        <span className="line">
          <span className="tok-keyword">export const</span>
          <span className="tok-plain"> middleware = </span>
          <span className="tok-fn">crawlpay</span>
          <span className="tok-plain">({"{"}</span>
        </span>
        <span className="line">
          <span className="tok-plain">{"  "}</span>
          <span className="tok-prop">price</span>
          <span className="tok-plain">: </span>
          <span className="tok-string">&apos;0.001&apos;</span>
          <span className="tok-plain">,</span>
        </span>
        <span className="line">
          <span className="tok-plain">{"  "}</span>
          <span className="tok-prop">network</span>
          <span className="tok-plain">: </span>
          <span className="tok-string">&apos;base&apos;</span>
          <span className="tok-plain">,</span>
        </span>
        <span className="line">
          <span className="tok-plain">{"  "}</span>
          <span className="tok-prop">wallet</span>
          <span className="tok-plain">: </span>
          <span className="tok-string">&apos;0xYourWallet&apos;</span>
          <span className="tok-plain">,</span>
        </span>
        <span className="line">
          <span className="tok-plain">{"  "}</span>
          <span className="tok-prop">mode</span>
          <span className="tok-plain">: </span>
          <span className="tok-string">&apos;standard&apos;</span>
          <span className="tok-plain">,</span>
        </span>
        <span className="line">
          <span className="tok-plain">{"})"}</span>
        </span>
        <span className="line"> </span>
        <span className="line">
          <span className="tok-comment">{"// 3. ship. bots will figure it out."}</span>
          <span className="cursor-blink" />
        </span>
      </div>
    </div>
  );
}
