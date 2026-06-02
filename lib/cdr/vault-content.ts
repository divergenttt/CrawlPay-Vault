import "server-only";

import { accessVault } from "./vault";

/** Story CDR vault id from header, query, or env (numeric asset id). */
export function parseVaultUuid(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const uuid = Number(value.trim());
  if (!Number.isFinite(uuid) || uuid <= 0) return null;
  return uuid;
}

type VaultUuidSource = {
  searchParams?: { get(name: string): string | null };
  headers?: { get(name: string): string | null };
};

/** Resolve vault id: X-CrawlPay-Vault header → ?vault= → CRAWLPAY_VAULT_UUID. */
export function resolveVaultUuidFromRequest(req: VaultUuidSource): number | null {
  const header =
    req.headers?.get("x-crawlpay-vault") ?? req.headers?.get("X-CrawlPay-Vault");
  const fromHeader = parseVaultUuid(header);
  if (fromHeader != null) return fromHeader;

  const fromQuery = parseVaultUuid(
    req.searchParams?.get("vault") ?? req.searchParams?.get("vault_uuid") ?? null
  );
  if (fromQuery != null) return fromQuery;

  return parseVaultUuid(process.env.CRAWLPAY_VAULT_UUID);
}

/** Decrypt vault payload after payment; same parsing as POST /api/vault. */
export async function decryptVaultContent(uuid: number): Promise<unknown> {
  const decrypted = await accessVault(uuid);
  try {
    return JSON.parse(decrypted) as unknown;
  } catch {
    return decrypted;
  }
}
