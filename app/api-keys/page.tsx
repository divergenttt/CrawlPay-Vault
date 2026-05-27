"use client";

import Link from "next/link";
import { PageTransition } from "@/components/page-transition";

export default function ApiKeysPage() {
  return (
    <>
      <PageTransition />
      <div className="cursor-ring" />
      <div className="cursor-dot" />
      <main className="db-shell">
        <header className="db-header">
          <div className="db-header-left">
            <h1 className="section-title">API Keys</h1>
            <p className="section-kicker">
              Manage CrawlPay credentials, key scopes, and rotation policies for
              secure integration.
            </p>
          </div>
          <div className="db-header-right">
            <Link href="/" className="db-back" data-page-link>
              ← HOME
            </Link>
          </div>
        </header>
      </main>
    </>
  );
}
