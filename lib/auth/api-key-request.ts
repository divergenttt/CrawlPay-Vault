import type { NextRequest } from "next/server";

const API_KEY_PREFIX = "cr_live_";

/** Bearer `cr_live_…` or `X-CrawlPay-Api-Key` for agent requests. */
export function getApiKeyTokenFromRequest(req: NextRequest): string | null {
  const authorization = req.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token.startsWith(API_KEY_PREFIX)) return token;
  }

  const header = req.headers.get("x-crawlpay-api-key");
  if (header?.trim().startsWith(API_KEY_PREFIX)) {
    return header.trim();
  }

  return null;
}
