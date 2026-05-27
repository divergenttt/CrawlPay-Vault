import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { requirePrivyAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

/** Server-side session check — never trust client-only `authenticated` flags. */
export async function GET(req: NextRequest) {
  const limited = await checkRateLimit(req, "auth:session");
  if (limited) return limited;

  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { authenticated: true },
    {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    }
  );
}
