"use client";

import Link from "next/link";
import { PageTransition } from "@/components/page-transition";

export default function WebSdkPage() {
  return (
    <>
      <PageTransition />
      <div className="cursor-ring" />
      <div className="cursor-dot" />
      <main className="db-shell">
        <header className="db-header">
          <div className="db-header-left">
            <h1 className="section-title">Web SDK</h1>
            <p className="section-kicker">
              Integrate CrawlPay directly into your frontend with ready-made web
              components and payment hooks.
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
