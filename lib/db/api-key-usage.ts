import "server-only";

import { supabase } from "@/lib/payments/supabase";

function utcUsageDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getApiKeyDailySpent(
  apiKeyId: string,
  usageDay: string = utcUsageDay()
): Promise<number> {
  const { data, error } = await supabase
    .from("api_key_usage")
    .select("spent_usdc")
    .eq("api_key_id", apiKeyId)
    .eq("usage_day", usageDay)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return 0;
  return Number(data.spent_usdc);
}

export async function recordApiKeyUsage(
  apiKeyId: string,
  amountUsdc: number,
  usageDay: string = utcUsageDay()
): Promise<void> {
  const { data: row, error: readErr } = await supabase
    .from("api_key_usage")
    .select("spent_usdc, request_count")
    .eq("api_key_id", apiKeyId)
    .eq("usage_day", usageDay)
    .maybeSingle();

  if (readErr) throw new Error(readErr.message);

  const spent = row ? Number(row.spent_usdc) : 0;
  const count = row ? Number(row.request_count) : 0;

  if (row) {
    const { error } = await supabase
      .from("api_key_usage")
      .update({
        spent_usdc: spent + amountUsdc,
        request_count: count + 1,
      })
      .eq("api_key_id", apiKeyId)
      .eq("usage_day", usageDay);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("api_key_usage").insert({
    api_key_id: apiKeyId,
    usage_day: usageDay,
    spent_usdc: amountUsdc,
    request_count: 1,
  });

  if (error) throw new Error(error.message);
}
