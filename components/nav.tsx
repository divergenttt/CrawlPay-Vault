"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import "@/components/auth/user-account-menu.css";
import { LogoMark } from "@/components/logo-mark";
import { useScrolled } from "@/lib/hooks";

const NAV_SECTIONS = ["protocol", "flow", "sdk"] as const;

const CONNECT_ROUTES = [
  "/connect/ai-agents",
  "/connect/api-keys",
  "/connect/web-sdk",
] as const;

export function Nav() {
  const scrolled = useScrolled(40);
  const [active, setActive] = useState("");

  const warmPrivy = useCallback(() => {
    void import("@/app/privy-providers");
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    NAV_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const links = [
    { id: "protocol", label: "Protocol" },
    { id: "flow", label: "Flow" },
    { id: "sdk", label: "SDK" },
  ];

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-left">
        <Link
          href="/"
          className="nav-logo"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <LogoMark size={18} color="var(--accent-bright)" />
          <span>CrawlPay</span>
        </Link>
      </div>
      <div className="nav-center">
        <div className="nav-links">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={active === l.id ? "active" : ""}
              onClick={(e) => scrollTo(e, l.id)}
            >
              {l.label}
            </a>
          ))}
          <div
            className="nav-dropdown"
            onMouseEnter={warmPrivy}
            onFocus={warmPrivy}
          >
            <button type="button" className="nav-dropdown-trigger" aria-haspopup="true">
              Connect
              <svg className="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="nav-dropdown-menu" role="menu">
              <div className="nav-dropdown-menu-inner">
                {CONNECT_ROUTES.map((href, i) => (
                  <Link
                    key={href}
                    href={href}
                    prefetch
                    data-page-link
                    role="menuitem"
                    onMouseEnter={warmPrivy}
                  >
                    <span className={`dot ${["ai", "api", "web"][i]}`} />
                    {href === "/connect/ai-agents"
                      ? "AI Agents"
                      : href === "/connect/api-keys"
                        ? "API Keys"
                        : "Web SDK"}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <a
            href="https://github.com/divergenttt/CrawlPay-"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </div>
      <div className="nav-right">
        <Link
          href="/connect/api-keys"
          className="cp-user-signin"
          data-page-link
          prefetch
          onMouseEnter={warmPrivy}
        >
          Sign in
        </Link>
        <Link href="/dashboard" className="nav-cta" data-page-link prefetch>
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
