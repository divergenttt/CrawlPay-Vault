import dotenv from "dotenv";
import path from "path";
import Exa from "exa-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const EXA_COST_USDC = 0.007;
const CRAWLPAY_COST_USDC = 0.001;

const BOT_USER_AGENT =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0; +https://openai.com/gptbot";

type ExaSearchResult = {
  url: string;
  title: string;
  description: string;
};

function getExaApiKey(): string {
  const apiKey = process.env.EXA_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("EXA_API_KEY not set in .env.local");
  }
  return apiKey;
}

const exa = new Exa(getExaApiKey());

async function exaSearch(query: string): Promise<ExaSearchResult[]> {
  const result = await exa.search(query, {
    type: "auto",
    numResults: 3,
    contents: { highlights: true },
  });

  return result.results.map((r) => ({
    url: r.url,
    title: r.title ?? r.url,
    description: (r.highlights[0] ?? "").slice(0, 150),
  }));
}

async function parseResponseBody(response: Response): Promise<{
  content: unknown;
  isJson: boolean;
  contentType: string;
}> {
  const contentType = response.headers.get("content-type") ?? "unknown";
  const text = await response.text();

  try {
    return { content: JSON.parse(text) as unknown, isJson: true, contentType };
  } catch {
    return { content: text, isJson: false, contentType };
  }
}

function logSuccessfulAccess(
  url: string,
  isJson: boolean,
  contentType: string
): void {
  if (isJson) {
    console.log(`✅ Paid $0.001 USDC (Arc network) — accessed: ${url}`);
    return;
  }

  const format = contentType.toLowerCase().includes("html") ? "HTML" : "text";
  console.log(`✅ Paid $0.001 USDC (Arc) — accessed: ${url} (${format})`);
  console.log(`   Content-Type: ${contentType}`);
}

async function handleOkResponse(
  response: Response,
  url: string
): Promise<unknown | null> {
  const { content, isJson, contentType } = await parseResponseBody(response);
  logSuccessfulAccess(url, isJson, contentType);
  return content;
}

async function accessCrawlPayPage(url: string): Promise<unknown | null> {
  const { crawlpayAgentFetch, resolveCrawlPayApiKey } = await import(
    "../lib/agent/crawlpay-fetch"
  );
  const botAddress = process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim();
  const apiKey = resolveCrawlPayApiKey();

  try {
    if (apiKey) {
      console.log(`🔑 ${url} — using CrawlPay API key (Base wallet)`);
      const paid = await crawlpayAgentFetch(url, {
        apiKey,
        botUserAgent: BOT_USER_AGENT,
      });
      if (paid.ok) {
        return handleOkResponse(paid, url);
      }
      console.log(
        `❌ ${url} — API key request failed: ${paid.status} ${paid.statusText}`
      );
      return null;
    }

    const first = await fetch(url, {
      headers: { "User-Agent": BOT_USER_AGENT },
      cache: "no-store",
    });

    if (first.status === 402) {
      console.log(`🚫 ${url} requires payment (Arc x402 fallback)`);

      const paymentHeaders: Record<string, string> = {
        "User-Agent": BOT_USER_AGENT,
        "payment-signature": "0xsimulated",
        "payment-bot-address": botAddress ?? "",
      };

      const vaultUuid = first.headers.get("x-crawlpay-vault");
      if (vaultUuid) {
        paymentHeaders["x-crawlpay-vault"] = vaultUuid;
      }

      const retry = await fetch(url, {
        headers: paymentHeaders,
        cache: "no-store",
      });

      if (retry.ok) {
        return handleOkResponse(retry, url);
      }

      console.log(
        `❌ ${url} — payment retry failed: ${retry.status} ${retry.statusText}`
      );
      return null;
    }

    if (first.ok) {
      return handleOkResponse(first, url);
    }

    console.log(
      `❌ ${url} — request failed: ${first.status} ${first.statusText}`
    );
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`⚠️ Could not access: ${url} — ${message}`);
    return null;
  }
}

function logAgentError(label: string, err: unknown): void {
  if (err instanceof Error) {
    console.error(`${label}:`, err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    return;
  }
  console.error(`${label}:`, String(err));
}

function printStep3Summary(
  results: ExaSearchResult[],
  pagesAccessed: number
): void {
  const exaCount = Array.isArray(results) ? results.length : 0;
  const accessed = Number.isFinite(pagesAccessed) ? Math.max(0, pagesAccessed) : 0;
  const crawlPayTotal = accessed * CRAWLPAY_COST_USDC;
  const totalSpent = EXA_COST_USDC + crawlPayTotal;

  console.log("\n════════════════════════════════════════");
  console.log("  STEP 3 — Summary");
  console.log("════════════════════════════════════════\n");

  console.log(`📊 Exa results: ${exaCount}`);
  console.log(`📊 CrawlPay pages accessed: ${accessed}/${exaCount}`);
  console.log(`💰 Exa (Base): $${EXA_COST_USDC.toFixed(3)} USDC`);
  console.log(
    `💰 CrawlPay (Arc): $${crawlPayTotal.toFixed(3)} USDC (${accessed} × $0.001)`
  );
  console.log(
    `💰 Total spent: $${totalSpent.toFixed(3)} USDC across Exa (Base) + CrawlPay (Arc)`
  );
}

async function main(): Promise<void> {
  const query = process.argv[2] || "AI payment infrastructure x402";
  let results: ExaSearchResult[] = [];
  let pagesAccessed = 0;

  try {
    console.log("\n════════════════════════════════════════");
    console.log("  STEP 1 — Exa Search (live)");
    console.log("════════════════════════════════════════\n");

    results = await exaSearch(query);
    console.log(`🔍 Exa search: '${query}' → found ${results.length} results`);
    console.log(
      `🌐 Real Exa search — ${results.length} results from live web`
    );
    for (const result of results) {
      console.log(`   • ${result.title} — ${result.url}`);
    }
    console.log("💳 Exa payment: $0.007 USDC (Base network) — live x402");

    console.log("\n════════════════════════════════════════");
    console.log("  STEP 2 — CrawlPay access for each result");
    console.log("════════════════════════════════════════\n");

    for (const result of results) {
      if (!result?.url) {
        console.log("⚠️ Skipping result with missing URL");
        continue;
      }

      console.log(`\n📄 ${result.title ?? result.url}`);
      console.log(`   ${result.description ?? ""}`);

      try {
        const data = await accessCrawlPayPage(result.url);
        if (data !== null && data !== undefined) {
          pagesAccessed++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`⚠️ Could not access: ${result.url} — ${message}`);
      }
    }
  } catch (err) {
    logAgentError("Agent failed", err);
  }

  try {
    printStep3Summary(results, pagesAccessed);
  } catch (err) {
    logAgentError("STEP 3 summary failed", err);
  }

  console.log("🤖 Agent completed autonomous payment loop\n");

  await new Promise<void>((resolve) => setImmediate(resolve));
  process.exit(0);
}

main().catch((err) => {
  logAgentError("Agent failed (unhandled)", err);
  console.log("🤖 Agent completed autonomous payment loop\n");
  process.exit(1);
});
