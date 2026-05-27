/** Shared Privy / OAuth error copy for hooks and URL parsing. */
export function formatSocialLoginError(error: unknown): string | null {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unable to start sign-in.";

  const lower = message.toLowerCase();

  if (
    lower.includes("exited_auth_flow") ||
    lower.includes("exited_link_flow") ||
    lower.includes("user_denied") ||
    lower.includes("user rejected")
  ) {
    return null;
  }

  if (lower.includes("redirect_uri_mismatch")) {
    return [
      "Google OAuth: redirect URI mismatch in Google Cloud Console.",
      "Add exactly: https://auth.privy.io/api/v1/oauth/callback",
      "JavaScript origins: http://localhost:3000",
    ].join("\n");
  }

  if (lower.includes("authentication failed")) {
    return [
      "Privy could not finish sign-in (often embedded wallet on Base Sepolia).",
      "Privy Dashboard → Embedded wallets → Ethereum + Base Sepolia enabled.",
      "Privy Dashboard → Allowed domains → http://localhost:3000",
    ].join("\n");
  }

  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    return [
      "Could not reach Privy (network error).",
      "Check your connection, VPN/ad-blocker, and that NEXT_PUBLIC_PRIVY_APP_ID is set.",
      "Privy Dashboard → Allowed domains must include this site (e.g. http://localhost:3000).",
    ].join("\n");
  }

  if (lower.includes("not allowed")) {
    return [
      "This login method is not enabled in your Privy app.",
      "dashboard.privy.io → Login methods → enable the provider.",
    ].join("\n");
  }

  if (lower.includes("unknown_auth_error") || lower.includes("oauth_error")) {
    return [
      "Privy could not complete OAuth exchange.",
      "Try again — do not refresh while returning from Google.",
      "Privy Dashboard → Allowed domains → http://localhost:3000",
      "Privy Dashboard → Embedded wallets → Ethereum + Base Sepolia enabled.",
      "Google redirect URI: https://auth.privy.io/api/v1/oauth/callback",
    ].join("\n");
  }

  if (process.env.NODE_ENV === "production") {
    return "Sign-in failed. Please try again or use another provider.";
  }

  return message;
}
