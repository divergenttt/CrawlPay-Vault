import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/payments/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), 100);
  const offset = (page - 1) * limit;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data, error, count } = await supabase
        .from("payments")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const total = count ?? 0;
      const rows = data ?? [];

      return NextResponse.json({
        data: rows,
        total,
        page,
        limit,
        hasMore: offset + rows.length < total,
      });
    } catch (err) {
      if (attempt === 3) {
        return NextResponse.json(
          { error: "Failed to load payments" },
          { status: 500 }
        );
      }
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
}
