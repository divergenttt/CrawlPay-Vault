import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import {
  getAccessTokenFromRequest,
  isPrivyServerConfigured,
  verifyPrivyAccessToken,
  type VerifiedPrivySession,
} from "@/lib/auth/privy-server";

export type AuthResult =
  | { ok: true; session: VerifiedPrivySession }
  | { ok: false; response: NextResponse };

export async function requirePrivyAuth(
  req: NextRequest
): Promise<AuthResult> {
  if (!isPrivyServerConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Authentication is not configured on the server. Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET in Vercel (Production), then redeploy.",
        },
        { status: 503 }
      ),
    };
  }

  const accessToken = getAccessTokenFromRequest(req);
  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const session = await verifyPrivyAccessToken(accessToken);
    return { ok: true, session };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or expired session" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      ),
    };
  }
}
