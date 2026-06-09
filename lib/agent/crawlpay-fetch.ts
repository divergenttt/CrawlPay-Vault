/**
 * Agent HTTP helper: CrawlPay API key (Base/Polygon) or Arc x402 headers.
 * Set CRAWLPAY_API_KEY=cr_live_… for API-key billing against the owner's wallet.
 */

export type CrawlPayAgentNetwork = "base" | "polygon";

export type CrawlPayFetchOptions = {
  apiKey?: string;
  botUserAgent?: string;
  /** Settlement network sent as X-CrawlPay-Network (falls back to CRAWLPAY_NETWORK). */
  network?: CrawlPayAgentNetwork;
  /** Arc x402 fallback when no API key */
  paymentSignature?: string;
  paymentBotAddress?: string;
  vaultUuid?: string;
  headers?: Record<string, string>;
};

function resolveNetworkHeader(network?: string): string | undefined {
  const raw = (network ?? process.env.CRAWLPAY_NETWORK)?.trim().toLowerCase();
  if (raw === "base" || raw === "polygon") return raw;
  return undefined;
}

export function resolveCrawlPayApiKey(explicit?: string): string | undefined {
  const key =
    explicit?.trim() ||
    process.env.CRAWLPAY_API_KEY?.trim() ||
    process.env.CRAWLPAY_AGENT_API_KEY?.trim();
  return key?.startsWith("cr_live_") ? key : undefined;
}

export function buildCrawlPayAgentHeaders(
  options: CrawlPayFetchOptions = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent":
      options.botUserAgent ??
      process.env.CRAWLPAY_BOT_USER_AGENT ??
      "GPTBot (CrawlPay-Agent/1.0)",
    ...options.headers,
  };

  const networkHeader = resolveNetworkHeader(options.network);
  if (networkHeader) {
    headers["X-CrawlPay-Network"] = networkHeader;
  }

  const apiKey = resolveCrawlPayApiKey(options.apiKey);
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    return headers;
  }

  if (options.paymentSignature && options.paymentBotAddress) {
    headers["payment-signature"] = options.paymentSignature;
    headers["payment-bot-address"] = options.paymentBotAddress;
  }

  if (options.vaultUuid) {
    headers["x-crawlpay-vault"] = options.vaultUuid;
  }

  return headers;
}

/** Fetch a CrawlPay-protected URL as a bot (API key or x402 headers). */
export async function crawlpayAgentFetch(
  url: string,
  options: CrawlPayFetchOptions = {}
): Promise<Response> {
  return fetch(url, {
    headers: buildCrawlPayAgentHeaders(options),
    cache: "no-store",
  });
}

/** API-key fetch with optional x402 retry (same behavior as MCP fetchPaidPage). */
export async function fetchPaidPage(
  url: string,
  network?: CrawlPayAgentNetwork
): Promise<Response> {
  const apiKey = resolveCrawlPayApiKey();
  const first = await crawlpayAgentFetch(url, { network });

  if (apiKey || first.status !== 402) {
    return first;
  }

  const botAddress = process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim() ?? "";
  return fetch(url, {
    headers: {
      ...buildCrawlPayAgentHeaders({ network }),
      "payment-signature": "0xsimulated",
      "payment-bot-address": botAddress,
      ...(first.headers.get("x-crawlpay-vault")
        ? { "x-crawlpay-vault": first.headers.get("x-crawlpay-vault")! }
        : {}),
    },
    cache: "no-store",
  });
}
