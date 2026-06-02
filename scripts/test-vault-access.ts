import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/** Run: npm run vault:test  (requires CRAWLPAY_VAULT_UUID in .env.local) */
async function main() {
  const uuid = process.env.CRAWLPAY_VAULT_UUID;
  if (!uuid) {
    throw new Error(
      "Missing CRAWLPAY_VAULT_UUID — set it in .env.local (from upload-vault.ts output)"
    );
  }

  const { accessVault } = await import("../lib/cdr/vault");

  console.log(`Accessing CDR vault uuid=${uuid}...`);

  const decrypted = await accessVault(Number(uuid));
  const content = JSON.parse(decrypted) as unknown;

  console.log("Decrypted vault content:");
  console.log(JSON.stringify(content, null, 2));
}

main().catch((err) => {
  console.error("Vault access test failed:");
  if (err instanceof Error) {
    console.error("  message:", err.message);
    if (err.cause) console.error("  cause:", err.cause);
    if (err.stack) console.error(err.stack);
  } else {
    console.error(err);
  }
  process.exit(1);
});
