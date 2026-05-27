import { GatewayClient } from "@circle-fin/x402-batching/client";
import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAuth } from "@/lib/auth/require-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ZERO_BALANCE = {
  wallet: "0",
  available: "0",
  total: "0",
  withdrawing: "0",
};

export async function GET(req: NextRequest) {
  const auth = await requireDashboardAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const privateKey = process.env.SELLER_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({
        ...ZERO_BALANCE,
        error: "Missing SELLER_PRIVATE_KEY",
      });
    }

    const client = new GatewayClient({
      chain: "arcTestnet",
      privateKey: privateKey as `0x${string}`,
    });

    const balances = await client.getBalances();

    return NextResponse.json({
      wallet: balances.wallet.formatted,
      available: balances.gateway.formattedAvailable,
      total: balances.gateway.formattedTotal,
      withdrawing: balances.gateway.formattedWithdrawing,
    });
  } catch (err) {
    return NextResponse.json({
      ...ZERO_BALANCE,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
