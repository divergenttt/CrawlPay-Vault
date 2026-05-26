/*
CREATE TABLE payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_name text NOT NULL,
  user_agent text,
  page_url text DEFAULT '/',
  amount_usdc numeric DEFAULT 0.001,
  tx_hash text,
  created_at timestamptz DEFAULT now()
);
*/

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Payment } from "../types";

export { createClient } from "./supabase-browser";

let serverClient: SupabaseClient | undefined;

function getServerClient(): SupabaseClient {
  if (!serverClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables"
      );
    }
    serverClient = createSupabaseClient(supabaseUrl, supabaseServiceKey);
  }
  return serverClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getServerClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});

export async function savePayment(
  payment: Omit<Payment, "id" | "created_at">
) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data, error } = await getServerClient()
        .from("payments")
        .insert([payment])
        .select();

      if (error) throw new Error("Supabase error: " + error.message);
      return data;
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err);
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
}
