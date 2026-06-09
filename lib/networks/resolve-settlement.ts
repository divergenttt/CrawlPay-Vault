import {
  isCrawlPayNetworkId,
  resolveNetworkId,
  type CrawlPayNetworkId,
} from "@/lib/networks/chains";

/** User/dashboard preference — maps to one or two settlement chains. */
export type CrawlPayNetworkPreference = "base" | "polygon" | "both";

/** Default order when `both` is allowed (Base first for backwards compatibility). */
export const SETTLEMENT_NETWORK_ORDER: readonly CrawlPayNetworkId[] = [
  "base",
  "polygon",
] as const;

export function isNetworkPreference(
  value: string | undefined | null
): value is CrawlPayNetworkPreference {
  return value === "base" || value === "polygon" || value === "both";
}

export function parseNetworkPreference(
  value: string | undefined | null
): CrawlPayNetworkPreference {
  const raw = value?.trim().toLowerCase();
  if (raw === "polygon" || raw === "both") return raw;
  return "base";
}

/** Expand preference to concrete EVM networks (env fallback when preference omitted). */
export function resolveSettlementNetworks(
  preference?: CrawlPayNetworkPreference | string | null
): CrawlPayNetworkId[] {
  const pref =
    preference != null
      ? parseNetworkPreference(preference)
      : parseNetworkPreference(
          process.env.CRAWLPAY_NETWORK ??
            process.env.NEXT_PUBLIC_CRAWLPAY_NETWORK
        );

  if (pref === "both") return [...SETTLEMENT_NETWORK_ORDER];
  return [pref];
}

export type SettlementNetworkContext = {
  /** Dashboard `user_settings.network` (Phase 2+). */
  preference?: CrawlPayNetworkPreference | string | null;
  /** Agent request header `X-CrawlPay-Network`. */
  requestedNetwork?: CrawlPayNetworkId | string | null;
  /** Explicit env fallback when preference is omitted. */
  envFallback?: CrawlPayNetworkId | string | null;
};

/**
 * Parse `X-CrawlPay-Network` (single id or comma-separated list — first valid wins).
 */
export function parseNetworkHeader(
  value: string | undefined | null
): CrawlPayNetworkId | null {
  if (!value?.trim()) return null;

  for (const part of value.split(",")) {
    const id = part.trim().toLowerCase();
    if (isCrawlPayNetworkId(id)) return id;
  }

  return null;
}

export function getNetworkHeaderFromRequest(req: {
  headers: Headers;
}): CrawlPayNetworkId | null {
  return (
    parseNetworkHeader(req.headers.get("x-crawlpay-network")) ??
    parseNetworkHeader(req.headers.get("X-CrawlPay-Network"))
  );
}

/**
 * Pick one settlement network.
 *
 * Priority:
 * 1. Request header (always wins when valid)
 * 2. First network from preference (`base` before `polygon` when `both`)
 * 3. Env fallback (`CRAWLPAY_NETWORK` / `NEXT_PUBLIC_CRAWLPAY_NETWORK`)
 * 4. `base`
 */
export function resolveSettlementNetwork(
  context: SettlementNetworkContext = {}
): CrawlPayNetworkId {
  const preferenceSource =
    context.preference ??
    context.envFallback ??
    process.env.CRAWLPAY_NETWORK ??
    process.env.NEXT_PUBLIC_CRAWLPAY_NETWORK;

  const allowed = resolveSettlementNetworks(
    parseNetworkPreference(preferenceSource)
  );

  const requested = parseNetworkHeader(
    context.requestedNetwork != null
      ? String(context.requestedNetwork)
      : null
  );

  if (requested) {
    return requested;
  }

  return allowed[0] ?? resolveNetworkId(preferenceSource);
}

/** Env-only default (no request / user context). */
export function getDefaultSettlementNetworkId(): CrawlPayNetworkId {
  return resolveSettlementNetwork();
}
