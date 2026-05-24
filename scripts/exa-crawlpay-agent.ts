import dotenv from "dotenv";
import path from "path";

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

function simulateExaSearch(query: string): ExaSearchResult[] {
  return [
    {
      url: "https://crawl-pay.vercel.app/api/page",
      title: "CrawlPay - AI Monetization",
      description: "Pay-per-crawl infrastructure for AI agents",
    },
    {
      url: "https://crawl-pay.vercel.app/api/page?topic=arc",
      title: "Arc Network Docs",
      description: "Circle L1 blockchain for USDC payments",
    },
    {
      url: "https://crawl-pay.vercel.app/api/page?topic=x402",
      title: "x402 Protocol Guide",
      description: "HTTP payment protocol for AI agents",
    },
  ];
}

async function accessCrawlPayPage(url: string): Promise<unknown | null> {
  const botAddress = process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim();

  const baseHeaders: Record<string, string> = {
    "User-Agent": BOT_USER_AGENT,
  };

  const first = await fetch(url, {
    headers: baseHeaders,
    cache: "no-store",
  });

  if (first.status === 402) {
    console.log(`🚫 ${url} requires payment`);

    const paymentHeaders: Record<string, string> = {
      ...baseHeaders,
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
      console.log(`✅ Paid $0.001 USDC (Arc network) — accessed: ${url}`);
      return retry.json();
    }

    console.log(
      `❌ ${url} — payment retry failed: ${retry.status} ${retry.statusText}`
    );
    return null;
  }

  if (first.ok) {
    console.log(`✅ Paid $0.001 USDC (Arc network) — accessed: ${url}`);
    return first.json();
  }

  console.log(`❌ ${url} — request failed: ${first.status} ${first.statusText}`);
  return null;
}

async function main() {
  const query = process.argv[2] || "AI payment infrastructure x402";

  console.log("\n════════════════════════════════════════");
  console.log("  STEP 1 — Exa Search (simulated)");
  console.log("════════════════════════════════════════\n");

  const results = simulateExaSearch(query);
  console.log(`🔍 Exa search: '${query}' → found ${results.length} results`);
  for (const result of results) {
    console.log(`   • ${result.title} — ${result.url}`);
  }
  console.log("💳 Exa payment: $0.007 USDC (Base network) — simulated");

  console.log("\n════════════════════════════════════════");
  console.log("  STEP 2 — CrawlPay access for each result");
  console.log("════════════════════════════════════════\n");

  let pagesAccessed = 0;

  for (const result of results) {
    console.log(`\n📄 ${result.title}`);
    console.log(`   ${result.description}`);
    const data = await accessCrawlPayPage(result.url);
    if (data !== null) {
      pagesAccessed++;
    }
  }

  const crawlPayTotal = pagesAccessed * CRAWLPAY_COST_USDC;
  const totalSpent = EXA_COST_USDC + crawlPayTotal;

  console.log("\n════════════════════════════════════════");
  console.log("  STEP 3 — Summary");
  console.log("════════════════════════════════════════\n");

  console.log(`📊 Exa results: ${results.length}`);
  console.log(`📊 CrawlPay pages accessed: ${pagesAccessed}/${results.length}`);
  console.log(`💰 Exa (Base): $${EXA_COST_USDC.toFixed(3)} USDC`);
  console.log(
    `💰 CrawlPay (Arc): $${crawlPayTotal.toFixed(3)} USDC (${pagesAccessed} × $0.001)`
  );
  console.log(
    `💰 Total spent: $${totalSpent.toFixed(3)} USDC across Exa (Base) + CrawlPay (Arc)`
  );
  console.log("🤖 Agent completed autonomous payment loop\n");
}

main().catch((err) => {
  console.error("Agent failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
