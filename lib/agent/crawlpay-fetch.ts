/**
 * Agent HTTP helper: CrawlPay API key (Base ledger) or Arc x402 headers.
 * Set CRAWLPAY_API_KEY=cr_live_… for API-key billing against the owner's Base wallet.
 */

export type CrawlPayFetchOptions = {
  apiKey?: string;
  botUserAgent?: string;
  /** Arc x402 fallback when no API key */
  paymentSignature?: string;
  paymentBotAddress?: string;
  vaultUuid?: string;
  headers?: Record<string, string>;
};

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
