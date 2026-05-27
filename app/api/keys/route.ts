import { NextRequest, NextResponse } from "next/server";
import {
  createApiKeyForUser,
  listApiKeysForUser,
} from "@/lib/db/api-keys";
import { requirePrivyAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const keys = await listApiKeysForUser(auth.session.userId);
    return NextResponse.json({ keys });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load keys" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      name?: unknown;
      perReq?: unknown;
      daily?: unknown;
    };

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim().replace(/\s+/g, "_")
        : "New_Agent_Key";

    const perReq = Number(body.perReq);
    const daily = Number(body.daily);

    if (!Number.isFinite(perReq) || perReq <= 0) {
      return NextResponse.json(
        { error: "perReq must be a positive number" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(daily) || daily <= 0) {
      return NextResponse.json(
        { error: "daily must be a positive number" },
        { status: 400 }
      );
    }
    if (daily < perReq) {
      return NextResponse.json(
        { error: "daily cannot be less than perReq" },
        { status: 400 }
      );
    }

    const created = await createApiKeyForUser(auth.session.userId, {
      name,
      perReqUsdc: perReq,
      dailyUsdc: daily,
    });

    return NextResponse.json({
      key: created.row,
      token: created.token,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create key" },
      { status: 500 }
    );
  }
}
