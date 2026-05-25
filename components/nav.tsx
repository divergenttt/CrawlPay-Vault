"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo-mark";
import { useScrolled } from "@/lib/hooks";

const NAV_SECTIONS = ["protocol", "flow", "sdk"] as const;

export function Nav() {
  const scrolled = useScrolled(40);
  const [active, setActive] = useState("");

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
        <Link href="/dashboard" className="nav-cta" data-page-link>
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
