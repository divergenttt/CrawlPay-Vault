import "server-only";

/** Restrict seller dashboard APIs to specific Privy user IDs (comma-separated). */
export function isDashboardUserAllowed(privyUserId: string): boolean {
  const raw = process.env.DASHBOARD_ALLOWED_PRIVY_USER_IDS?.trim();
  if (!raw) {
    return true;
  }

  const allowed = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return allowed.includes(privyUserId);
}
