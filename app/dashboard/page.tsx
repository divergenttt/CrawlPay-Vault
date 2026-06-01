"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { LogoMark } from "@/components/logo-mark";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onNotify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="db-soon">
      <div className="db-soon-inner">
        <Link href="/" className="db-soon-brand" data-page-link>
          <LogoMark size={22} color="#fff" />
          <span className="db-soon-wordmark">crawl-pay.com</span>
        </Link>

        <h1 className="db-soon-title">dashboard coming soon</h1>
        <p className="db-soon-sub">
          personal wallet analytics, crawl stats, and revenue tracking — in progress
        </p>

        <form className="db-soon-form" onSubmit={onNotify} noValidate>
          <input
            type="email"
            className="db-soon-input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitted}
            aria-label="Email address"
          />
          <button type="submit" className="db-soon-btn" disabled={submitted}>
            {submitted ? "noted" : "notify me"}
          </button>
        </form>
      </div>
    </main>
  );
}
