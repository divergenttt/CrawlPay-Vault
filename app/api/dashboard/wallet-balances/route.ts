import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/auth/require-auth";
import { fetchEmbeddedWalletForPrivyUser } from "@/lib/wallet/privy-user-wallet";
import { fetchArcUsdcBalance } from "@/lib/wallet/arc-usdc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const wallet = await fetchEmbeddedWalletForPrivyUser(auth.session.userId);
    const address = wallet?.address;
    if (!address) {
      return NextResponse.json({ base: 0, polygon: 0 });
    }

    const [base, polygon] = await Promise.all([
      fetchArcUsdcBalance(address, "base"),
      fetchArcUsdcBalance(address, "polygon"),
    ]);

    return NextResponse.json({ base, polygon });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Balance fetch failed" },
      { status: 500 }
    );
  }
}
