"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthUi } from "@/lib/auth/auth-ui-context";
import { LogoMark } from "@/components/logo-mark";
import { useEmbeddedWalletAddress } from "@/lib/wallet/use-embedded-wallet-address";

const TABS = [
  { href: "/dashboard/overview", label: "Overview" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/install", label: "Install" },
  { href: "/dashboard/wallet", label: "Wallet" },
] as const;

export function DashboardCabinetShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuthUi();
  const walletAddress = useEmbeddedWalletAddress();

  return (
    <main className="db-shell db-cabinet">
      <header className="db-header">
        <div className="db-header-left">
          <Link href="/" className="db-brand" data-page-link>
            <LogoMark size={18} color="#fff" />
            <span>CrawlPay</span>
          </Link>
          <p className="db-sub">
            personal cabinet
            {walletAddress ? (
              <>
                <span className="sep">·</span>
                <span>{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="db-header-right">
          <Link href="/" className="db-back" data-page-link>
            ← HOME
          </Link>
          <button
            type="button"
            className="db-back"
            onClick={() => signOut()}
          >
            SIGN OUT
          </button>
        </div>
      </header>

      <nav className="db-tabs" aria-label="Dashboard sections">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`db-tab${active ? " is-active" : ""}`}
              data-page-link
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="db-tab-panel">{children}</div>
    </main>
  );
}
