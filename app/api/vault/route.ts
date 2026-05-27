export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { accessVault } from "@/lib/cdr/vault";
import { isVaultOwnedByUser } from "@/lib/db/vault-ownership";
import { requirePrivyAuth } from "@/lib/auth/require-auth";

export async function POST(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as { uuid?: unknown };
    const uuid = Number(body.uuid);

    if (!Number.isFinite(uuid)) {
      return NextResponse.json({ error: "Invalid uuid" }, { status: 400 });
    }

    const allowed = await isVaultOwnedByUser(uuid, auth.session.userId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Vault not found or access denied" },
        { status: 403 }
      );
    }

    const decrypted = await accessVault(uuid);

    let content: unknown;
    try {
      content = JSON.parse(decrypted) as unknown;
    } catch {
      content = decrypted;
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error(
      "Vault API error:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    );
  }
}
