import "server-only";

import { NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const MAX_HITS = 40;
const SESSION_MAX_HITS = 120;

/**
 * In-memory rate limits (no Supabase round-trip per request).
 * auth:session is checked on every login — must stay fast on serverless.
 */
const memoryBuckets = new Map<string, { count: number; windowStart: number }>();

function bucketKey(req: NextRequest, route: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return `${route}:${ip}`;
}

function memoryRateLimit(
  req: NextRequest,
  route: string,
  maxHits: number
): NextResponse | null {
  const key = bucketKey(req, route);
  const windowStart = Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS;
  const entry = memoryBuckets.get(key);

  if (!entry || entry.windowStart !== windowStart) {
    memoryBuckets.set(key, { count: 1, windowStart });
    return null;
  }

  entry.count += 1;
  if (entry.count > maxHits) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  return null;
}

export async function checkRateLimit(
  req: NextRequest,
  route: string
): Promise<NextResponse | null> {
  const maxHits = route === "auth:session" ? SESSION_MAX_HITS : MAX_HITS;
  return memoryRateLimit(req, route, maxHits);
}
