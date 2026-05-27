"use client";

import Link from "next/link";
import { PageTransition } from "@/components/page-transition";

export default function AIAgentsPage() {
  return (
    <>
      <PageTransition />
      <div className="cursor-ring" />
      <div className="cursor-dot" />
      <main className="db-shell">
        <header className="db-header">
          <div className="db-header-left">
            <h1 className="section-title">AI Agents</h1>
            <p className="section-kicker">
              Configure autonomous agents that detect CrawlPay-protected resources
              and execute payment flows.
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
