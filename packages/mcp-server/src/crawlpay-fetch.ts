export type CrawlPayAgentNetwork = "base" | "polygon";

function resolveNetworkHeader(network?: string): string | undefined {
  const raw = (network ?? process.env.CRAWLPAY_NETWORK)?.trim().toLowerCase();
  if (raw === "base" || raw === "polygon") return raw;
  return undefined;
}

export function resolveCrawlPayApiKey(): string | undefined {
  const key =
    process.env.CRAWLPAY_API_KEY?.trim() ||
    process.env.CRAWLPAY_AGENT_API_KEY?.trim();
  return key?.startsWith("cr_live_") ? key : undefined;
}

export function buildAgentHeaders(
  base: Record<string, string> = {},
  network?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent":
      process.env.CRAWLPAY_BOT_USER_AGENT ?? "GPTBot (CrawlPay-MCP/1.0)",
    ...base,
  };

  const networkHeader = resolveNetworkHeader(network);
  if (networkHeader) {
    headers["X-CrawlPay-Network"] = networkHeader;
  }

  const apiKey = resolveCrawlPayApiKey();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

export async function fetchPaidPage(
  url: string,
  network?: CrawlPayAgentNetwork
): Promise<Response> {
  const apiKey = resolveCrawlPayApiKey();
  const first = await fetch(url, {
    headers: buildAgentHeaders({}, network),
    cache: "no-store",
  });

  if (apiKey || first.status !== 402) {
    return first;
  }

  const botAddress = process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim() ?? "";
  return fetch(url, {
    headers: {
      ...buildAgentHeaders({}, network),
      "payment-signature": "0xsimulated",
      "payment-bot-address": botAddress,
      ...(first.headers.get("x-crawlpay-vault")
        ? { "x-crawlpay-vault": first.headers.get("x-crawlpay-vault")! }
        : {}),
    },
    cache: "no-store",
  });
}
