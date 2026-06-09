import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/auth/require-auth";
import {
  getOrCreateGlobalSettings,
  listUserDomains,
  paymentMatchesDomains,
} from "@/lib/db/user-settings";
import { fetchEmbeddedWalletForPrivyUser } from "@/lib/wallet/privy-user-wallet";
import { supabase } from "@/lib/payments/supabase";
import type { Payment } from "@/lib/types";
import { resolveNetworkId } from "@/lib/networks/chains";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toNumber(value: unknown): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(String(value)) || 0;
}

function monthStartUtc(): number {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

export async function GET(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const networkFilter = searchParams.get("network") ?? "all";

  try {
    const wallet = await fetchEmbeddedWalletForPrivyUser(auth.session.userId);
    const walletAddress = wallet?.address ?? "";
    await getOrCreateGlobalSettings(auth.session.userId, walletAddress);
    const domains = (await listUserDomains(auth.session.userId)).map(
      (d) => d.domain
    );

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    let payments = (data ?? []) as Payment[];
    payments = payments.filter((p) => paymentMatchesDomains(p.page_url, domains));

    if (networkFilter === "base" || networkFilter === "polygon") {
      payments = payments.filter(
        (p) => resolveNetworkId(p.network ?? "base") === networkFilter
      );
    }

    const monthStart = monthStartUtc();
    let totalEarned = 0;
    let monthEarned = 0;

    for (const p of payments) {
      const amount = toNumber(p.amount_usdc);
      totalEarned += amount;
      if (new Date(p.created_at).getTime() >= monthStart) {
        monthEarned += amount;
      }
    }

    return NextResponse.json({
      metrics: {
        total_earned: totalEarned,
        month_earned: monthEarned,
        total_visits: payments.length,
      },
      payments: payments.slice(0, 100),
      wallet_address: walletAddress,
    });
  } catch (err) {
    console.error("Dashboard overview error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load overview" },
      { status: 500 }
    );
  }
}
