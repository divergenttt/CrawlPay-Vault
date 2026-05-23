import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { DashboardStats } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toNumber(value: unknown): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(String(value)) || 0;
}

function todayMidnightUtcIso(): string {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function GET() {
  const todayIso = todayMidnightUtcIso();

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const [allTime, today, uniqueBots] = await Promise.all([
        supabase
          .from("payments")
          .select("total_earned:amount_usdc.sum(), total_requests:id.count()")
          .maybeSingle(),
        supabase
          .from("payments")
          .select("today_earned:amount_usdc.sum()")
          .gte("created_at", todayIso)
          .maybeSingle(),
        supabase
          .from("payments")
          .select("bot_name, id.count()", { count: "exact", head: true }),
      ]);

      if (allTime.error) throw allTime.error;
      if (today.error) throw today.error;
      if (uniqueBots.error) throw uniqueBots.error;

      const stats: DashboardStats = {
        total_earned: toNumber(allTime.data?.total_earned),
        total_requests: toNumber(allTime.data?.total_requests),
        unique_bots: uniqueBots.count ?? 0,
        today_earned: toNumber(today.data?.today_earned),
      };

      return NextResponse.json(stats);
    } catch (err) {
      if (attempt === 3) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
      }
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
}
