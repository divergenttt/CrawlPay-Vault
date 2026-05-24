import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Re-upload after condition changes — vaults are immutable (e.g. uuid 2221 used
// LicenseReadCondition and cannot be updated; run this to mint a new UUID).
//
// Read slot uses EOA bypass (readConditionAddr = STORY_SELLER_ADDRESS).
// Write slot uses OwnerWriteCondition + encoded owner address.

const payload = {
  type: "premium-dataset",
  title: "AI Training Data Sample",
  description: "Private dataset accessible only after payment via CrawlPay",
  data: [
    {
      prompt: "What is x402?",
      response: "A payment protocol for AI agents",
    },
    {
      prompt: "What is Arc?",
      response: "Circle's L1 blockchain for USDC payments",
    },
    {
      prompt: "What is CrawlPay?",
      response: "Pay-per-crawl monetization for AI bots",
    },
  ],
  price: "0.001 USDC",
  network: "arcTestnet",
};

async function main() {
  const { uploadVault } = await import("../lib/cdr/vault");

  console.log("Uploading premium dataset to CDR vault...");

  const { uuid, cid } = await uploadVault(JSON.stringify(payload));

  console.log("Upload complete.");
  console.log("  uuid:", uuid);
  console.log("  cid:", cid);
  console.log("");
  console.log(`Add to .env.local: CRAWLPAY_VAULT_UUID=${uuid}`);
}

main().catch((err) => {
  console.error("Upload failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
