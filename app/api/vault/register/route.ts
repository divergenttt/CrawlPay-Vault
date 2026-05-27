import { NextRequest, NextResponse } from "next/server";
import { registerVaultOwner } from "@/lib/db/vault-ownership";
import { requirePrivyAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

/** Claim ownership of a CDR vault uuid after uploadVault(). */
export async function POST(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as { uuid?: unknown; cid?: unknown };
    const uuid = Number(body.uuid);

    if (!Number.isFinite(uuid) || uuid <= 0) {
      return NextResponse.json({ error: "Invalid uuid" }, { status: 400 });
    }

    await registerVaultOwner(
      uuid,
      auth.session.userId,
      typeof body.cid === "string" ? body.cid : undefined
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to register vault" },
      { status: 500 }
    );
  }
}
