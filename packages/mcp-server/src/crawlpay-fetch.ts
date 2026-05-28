export function resolveCrawlPayApiKey(): string | undefined {
  const key =
    process.env.CRAWLPAY_API_KEY?.trim() ||
    process.env.CRAWLPAY_AGENT_API_KEY?.trim();
  return key?.startsWith("cr_live_") ? key : undefined;
}

export function buildAgentHeaders(
  base: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent":
      process.env.CRAWLPAY_BOT_USER_AGENT ??
      "GPTBot (CrawlPay-MCP/1.0)",
    ...base,
  };

  const apiKey = resolveCrawlPayApiKey();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

export async function fetchPaidPage(url: string): Promise<Response> {
  const apiKey = resolveCrawlPayApiKey();
  const first = await fetch(url, {
    headers: buildAgentHeaders(),
    cache: "no-store",
  });

  if (apiKey || first.status !== 402) {
    return first;
  }

  const botAddress = process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim() ?? "";
  return fetch(url, {
    headers: {
      ...buildAgentHeaders(),
      "payment-signature": "0xsimulated",
      "payment-bot-address": botAddress,
      ...(first.headers.get("x-crawlpay-vault")
        ? { "x-crawlpay-vault": first.headers.get("x-crawlpay-vault")! }
        : {}),
    },
    cache: "no-store",
  });
}
