/** User-facing copy when Privy rejects the page origin (403 / "Origin not allowed"). */
export function formatPrivyOriginBlockedMessage(): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "your site URL";

  return [
    `Privy blocked this site: ${origin}`,
    "dashboard.privy.io → your app → Configuration → Allowed domains",
    `Add exactly: ${origin}`,
    "Local dev: also add http://localhost:3000 (and :3001 / :3002 if you use other ports).",
    "Save in Privy, then hard-refresh (Ctrl+Shift+R). No redeploy needed for dashboard changes.",
  ].join("\n");
}
