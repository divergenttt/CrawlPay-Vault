"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client";
import { useEmbeddedWalletAddress } from "@/lib/wallet/use-embedded-wallet-address";

const DOCS_URL = "https://github.com/divergenttt/CrawlPay-Vault-SDK";

export function InstallTab() {
  const wallet = useEmbeddedWalletAddress();
  const [network, setNetwork] = useState<"base" | "polygon">("base");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void authFetch("/api/dashboard/settings")
      .then((r) => r.json())
      .then((body: { settings?: { network?: string } }) => {
        const n = body.settings?.network;
        if (n === "polygon") setNetwork("polygon");
        else if (n === "both") setNetwork("base");
      })
      .catch(() => undefined);
  }, []);

  const snippet = `import { crawlpay } from '@crawlpay/sdk'

export default crawlpay({
  wallet: '${wallet ?? "0xYourWalletAddress"}',
  price: '0.001',
  network: '${network}',
})`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="db-cabinet-section">
      <h1 className="db-section-title">Install</h1>
      <p className="db-muted">
        Drop this middleware into your Next.js or Express app. Your wallet is
        pre-filled from your Privy embedded wallet.
      </p>

      <div className="db-code-wrap">
        <div className="db-code-head">
          <span>middleware.ts</span>
          <button type="button" className="db-btn db-btn--ghost" onClick={() => void copy()}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="db-code">{snippet}</pre>
      </div>

      <p className="db-muted">
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="db-link"
        >
          Full SDK docs on GitHub ↗
        </a>
      </p>
    </div>
  );
}
