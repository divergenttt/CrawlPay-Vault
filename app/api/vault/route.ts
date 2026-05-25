export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { accessVault } from "@/lib/cdr/vault";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { uuid?: unknown };
    const uuid = Number(body.uuid);

    if (!Number.isFinite(uuid)) {
      return NextResponse.json({ error: "Invalid uuid" }, { status: 400 });
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
