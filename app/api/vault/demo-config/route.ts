import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Vault id from server env for /connect/vault context panel. */
export async function GET() {
  const raw = process.env.CRAWLPAY_VAULT_UUID?.trim();
  const parsed = raw ? Number(raw) : NaN;
  const vaultUuid = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  return NextResponse.json({ vaultUuid });
}
