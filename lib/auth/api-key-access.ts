import "server-only";

import type { ApiKeyRow } from "@/lib/db/api-keys";
import { findApiKeyByToken } from "@/lib/db/api-keys";
import { getApiKeyDailySpent, recordApiKeyUsage } from "@/lib/db/api-key-usage";
import { getApiKeyTokenFromRequest } from "@/lib/auth/api-key-request";
import type { NextRequest } from "next/server";

export type ApiKeyAccessResult =
  | { ok: true; key: ApiKeyRow }
  | { ok: false; status: number; error: string };

export async function authorizeApiKeyForAmount(
  req: NextRequest,
  amountUsdc: number
): Promise<ApiKeyAccessResult> {
  const token = getApiKeyTokenFromRequest(req);
  if (!token) {
    return { ok: false, status: 401, error: "Missing API key (Bearer cr_live_… or X-CrawlPay-Api-Key)" };
  }

  let key: ApiKeyRow | null;
  try {
    key = await findApiKeyByToken(token);
  } catch (err) {
    return {
      ok: false,
      status: 500,
      error: err instanceof Error ? err.message : "API key lookup failed",
    };
  }

  if (!key) {
    return { ok: false, status: 401, error: "Invalid API key" };
  }

  if (key.status !== "active") {
    return { ok: false, status: 403, error: `API key is ${key.status}` };
  }

  const perReq = Number(key.per_req_usdc);
  const daily = Number(key.daily_usdc);

  if (amountUsdc > perReq) {
    return {
      ok: false,
      status: 402,
      error: `Request amount ${amountUsdc} USDC exceeds per-request limit ${perReq} USDC for key "${key.name}"`,
    };
  }

  const spentToday = await getApiKeyDailySpent(key.id);
  if (spentToday + amountUsdc > daily) {
    return {
      ok: false,
      status: 429,
      error: `Daily limit exceeded (${spentToday.toFixed(3)} / ${daily} USDC spent today)`,
    };
  }

  return { ok: true, key };
}

export async function commitApiKeyUsage(
  key: ApiKeyRow,
  amountUsdc: number
): Promise<void> {
  await recordApiKeyUsage(key.id, amountUsdc);
}

export function apiKeyTxHash(keyId: string): string {
  return `apikey_${keyId.replace(/-/g, "").slice(0, 16)}_${Date.now().toString(36)}`;
}
