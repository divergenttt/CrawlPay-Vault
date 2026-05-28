"use client";

import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import {
  UserAccountMenu,
  type SessionStatus,
} from "@/components/auth/user-account-menu";

type Props = {
  sessionStatus?: SessionStatus;
  /** Show profile chip when signed in (API keys uses the Session panel instead). */
  showAccountMenu?: boolean;
};

export function ConnectSiteHeader({
  sessionStatus,
  showAccountMenu = false,
}: Props) {
  return (
    <header className="db-header cn-fixed-header">
      <div className="db-header-left">
        <Link href="/" className="db-brand" data-page-link>
          <LogoMark size={18} color="#fff" />
          <span>CrawlPay</span>
        </Link>
      </div>
      <div className="db-header-right">
        {showAccountMenu ? (
          <UserAccountMenu variant="connect" sessionStatus={sessionStatus} />
        ) : null}
        <span className="db-live">
          <span className="db-live-dot" />
          <span>LIVE</span>
        </span>
        <Link href="/" className="db-back" data-page-link>
          ← HOME
        </Link>
      </div>
    </header>
  );
}
