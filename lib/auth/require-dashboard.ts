import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { isDashboardUserAllowed } from "@/lib/auth/dashboard-access";
import {
  requirePrivyAuth,
  type AuthResult,
} from "@/lib/auth/require-auth";

export async function requireDashboardAuth(
  req: NextRequest
): Promise<AuthResult> {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth;

  if (!isDashboardUserAllowed(auth.session.userId)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return auth;
}
