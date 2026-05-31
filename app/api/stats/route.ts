import { NextResponse } from "next/server";
import { supabase } from "@/lib/payments/supabase";
import type { DashboardStats } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PaymentStatsRow = {
  amount_usdc: number | string;
  bot_name: string;
  created_at: string;
};

function toNumber(value: unknown): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(String(value)) || 0;
}

function todayMidnightUtcMs(): number {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start.getTime();
}

function formatErrorResponse() {
  return { error: "Failed to load stats" };
}

function computeStats(payments: PaymentStatsRow[]): DashboardStats {
  const todayStartMs = todayMidnightUtcMs();

  let total_earned = 0;
  let today_earned = 0;

  for (const p of payments) {
    const amount = toNumber(p.amount_usdc);
    total_earned += amount;
    if (new Date(p.created_at).getTime() >= todayStartMs) {
      today_earned += amount;
    }
  }

  return {
    total_earned,
    total_requests: payments.length,
    unique_bots: new Set(payments.map((p) => p.bot_name)).size,
    today_earned,
  };
}

export async function GET() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("amount_usdc, bot_name, created_at")
        .limit(10000);

      if (error) throw error;

      return NextResponse.json(computeStats(data ?? []));
    } catch (err) {
      console.error(`Stats API error (attempt ${attempt}/3):`, err);
      if (attempt === 3) {
        return NextResponse.json(formatErrorResponse(), { status: 500 });
      }
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
}
