"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthUi } from "@/lib/auth/auth-ui-context";
import { getPrivyUserProfile } from "@/lib/auth/user-profile";
import { useClientMounted } from "@/lib/hooks";
import "./user-account-menu.css";

export type SessionStatus = "verified" | "checking" | "unverified";

type Props = {
  variant?: "nav" | "connect" | "dashboard";
  sessionStatus?: SessionStatus;
  signInHref?: string;
};

function ProviderBadge({ label }: { label: string }) {
  return <span className="cp-user-via">via {label}</span>;
}

function UserAvatar({
  profile,
  size = "md",
}: {
  profile: NonNullable<ReturnType<typeof getPrivyUserProfile>>;
  size?: "md" | "lg";
}) {
  const style = { ["--cp-user-accent" as string]: profile.accentColor };
  const cls = `cp-user-avatar${size === "lg" ? "" : ""}`;

  return (
    <div className={cls} style={style} aria-hidden>
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatarUrl} alt="" />
      ) : (
        profile.initials
      )}
    </div>
  );
}

export function UserAccountMenu({
  variant = "connect",
  sessionStatus,
  signInHref = "/connect/api-keys",
}: Props) {
  const { user } = usePrivy();
  const { ready, isSignedIn, isLoggingOut, signOut } = useAuthUi();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const profile = getPrivyUserProfile(user);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const handleSignOut = () => {
    close();
    signOut();
  };

  if (!ready) {
    return null;
  }

  if (!isSignedIn || !profile) {
    if (variant === "nav" || variant === "connect") {
      return (
        <Link href={signInHref} className="cp-user-signin" data-page-link>
          Sign in
        </Link>
      );
    }
    return null;
  }

  const statusDot =
    sessionStatus === "checking" ? (
      <span
        className="cp-user-status cp-user-status--pending"
        title="Verifying session…"
      />
    ) : sessionStatus === "verified" || sessionStatus === undefined ? (
      <span className="cp-user-status cp-user-status--ok" title="Signed in" />
    ) : (
      <span
        className="cp-user-status cp-user-status--pending"
        title="Session needs verification"
      />
    );

  const chipClass =
    variant === "nav" ? "cp-user-chip cp-user-chip--nav" : "cp-user-chip";

  return (
    <div className="cp-user-wrap" ref={wrapRef}>
      <button
        type="button"
        className={chipClass}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        title="Account — open menu to sign out"
      >
        <UserAvatar profile={profile} />
        <span className="cp-user-text">
          <span className="cp-user-name">{profile.displayName}</span>
          <ProviderBadge label={profile.providerLabel} />
        </span>
        {sessionStatus ? statusDot : null}
      </button>

      {open ? (
        <div className="cp-user-menu" role="menu">
          <div className="cp-user-menu-head">
            <UserAvatar profile={profile} size="lg" />
            <div className="min-w-0">
              <div className="cp-user-name">{profile.displayName}</div>
              <div className="cp-user-menu-sub">{profile.subtitle}</div>
              <ProviderBadge label={profile.providerLabel} />
            </div>
          </div>
          <button
            type="button"
            className="cp-user-signout"
            role="menuitem"
            disabled={isLoggingOut}
            onClick={handleSignOut}
          >
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

type BannerProps = {
  sessionStatus?: SessionStatus;
  showAccountMenu?: boolean;
};

/** Shown immediately after OAuth redirect while Privy finishes login. */
export function SigningInBanner() {
  const { isAuthPending, isSignedIn, loginPhase } = useAuthUi();
  const mounted = useClientMounted();

  if (!mounted || !isAuthPending || isSignedIn) return null;

  const label =
    loginPhase === "redirecting"
      ? "Redirecting to provider…"
      : "Finishing sign-in…";

  return (
    <div className="cp-signed-banner cp-signing-in-banner" role="status">
      <div className="cp-signed-banner-body">
        <p className="cp-signed-banner-text">
          <span className="cp-signing-spinner" aria-hidden />
          {label}
        </p>
        <p className="cp-signed-banner-hint">
          Completing login with Privy — do not refresh this page.
        </p>
      </div>
    </div>
  );
}

/** Inline “you’re signed in” strip — sits between hero and key tools on Connect pages. */
export function SignedInBanner({
  sessionStatus,
  showAccountMenu = true,
}: BannerProps) {
  const { user } = usePrivy();
  const { ready, isSignedIn } = useAuthUi();
  const mounted = useClientMounted();
  const profile = getPrivyUserProfile(user);

  if (!mounted || !isSignedIn || !profile) return null;

  const verifying = sessionStatus === "checking";
  const failed = sessionStatus === "unverified";

  return (
    <div
      className="cp-signed-banner"
      role="status"
      style={
        failed
          ? {
              borderColor: "rgba(255, 184, 108, 0.35)",
              background: "rgba(255, 184, 108, 0.06)",
            }
          : undefined
      }
    >
      <div className="cp-signed-banner-body">
        <p className="cp-signed-banner-text">
          Signed in as <strong>{profile.displayName}</strong>
          {verifying ? " — verifying session…" : failed ? "" : " ✓"}
        </p>
        {failed ? (
          <p className="cp-signed-banner-hint">
            Privy login succeeded, but the server session could not be verified.
            Try signing out and in again.
          </p>
        ) : verifying ? (
          <p className="cp-signed-banner-hint">
            Confirming your token with the server…
          </p>
        ) : (
          <p className="cp-signed-banner-hint">
            API key tools are unlocked. Open your profile on the right to sign
            out.
          </p>
        )}
      </div>
      {showAccountMenu ? (
        <UserAccountMenu variant="connect" sessionStatus={sessionStatus} />
      ) : null}
    </div>
  );
}
