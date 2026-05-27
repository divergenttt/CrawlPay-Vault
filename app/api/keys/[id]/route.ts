import { NextRequest, NextResponse } from "next/server";
import {
  deleteApiKeyForUser,
  updateApiKeyStatus,
  type ApiKeyStatus,
} from "@/lib/db/api-keys";
import { requirePrivyAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

function parseStatus(value: unknown): ApiKeyStatus | null {
  if (value === "active" || value === "paused" || value === "revoked") {
    return value;
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = params;

  try {
    const body = (await req.json()) as { status?: unknown };
    const status = parseStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const ok = await updateApiKeyStatus(auth.session.userId, id, status);
    if (!ok) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update key" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = params;

  try {
    const ok = await deleteApiKeyForUser(auth.session.userId, id);
    if (!ok) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete key" },
      { status: 500 }
    );
  }
}
