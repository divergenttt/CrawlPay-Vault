import "server-only";

import { PrivyClient } from "@privy-io/node";
import type { NextRequest } from "next/server";

const TOKEN_CACHE_TTL_MS = 60_000;
const TOKEN_CACHE_MAX = 1000;

let privyClient: PrivyClient | undefined;

const tokenCache = new Map<
  string,
  { session: VerifiedPrivySession; exp: number }
>();

function getPrivyClient(): PrivyClient {
  if (privyClient) return privyClient;

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
  const appSecret = process.env.PRIVY_APP_SECRET?.trim();

  if (!appId || !appSecret) {
    throw new Error(
      "Missing NEXT_PUBLIC_PRIVY_APP_ID or PRIVY_APP_SECRET for server auth"
    );
  }

  privyClient = new PrivyClient({ appId, appSecret });
  return privyClient;
}

export type VerifiedPrivySession = {
  userId: string;
  sessionId: string;
  appId: string;
};

function pruneTokenCache(): void {
  const now = Date.now();

  for (const [key, entry] of tokenCache) {
    if (entry.exp <= now) {
      tokenCache.delete(key);
    }
  }

  if (tokenCache.size <= TOKEN_CACHE_MAX) return;

  const overflow = tokenCache.size - TOKEN_CACHE_MAX;
  let removed = 0;
  for (const key of tokenCache.keys()) {
    tokenCache.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
}

/** Verify a Privy access token issued to this app (cached 60s per token). */
export async function verifyPrivyAccessToken(
  accessToken: string
): Promise<VerifiedPrivySession> {
  const now = Date.now();
  const cached = tokenCache.get(accessToken);
  if (cached && cached.exp > now) {
    return cached.session;
  }

  const claims = await getPrivyClient()
    .utils()
    .auth()
    .verifyAccessToken(accessToken);

  const session: VerifiedPrivySession = {
    userId: claims.user_id,
    sessionId: claims.session_id,
    appId: claims.app_id,
  };

  tokenCache.set(accessToken, {
    session,
    exp: now + TOKEN_CACHE_TTL_MS,
  });
  pruneTokenCache();

  return session;
}

const PRIVY_TOKEN_COOKIE_NAMES = [
  "privy-token",
  "privy-access-token",
] as const;

/** Bearer header or Privy session cookie (cookie name varies by SDK version). */
export function getAccessTokenFromRequest(req: NextRequest): string | null {
  const authorization = req.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token) return token;
  }

  for (const name of PRIVY_TOKEN_COOKIE_NAMES) {
    const cookieToken = req.cookies.get(name)?.value?.trim();
    if (cookieToken) return cookieToken;
  }

  return null;
}

export function isPrivyServerConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() &&
      process.env.PRIVY_APP_SECRET?.trim()
  );
}
