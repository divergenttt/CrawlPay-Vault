import "server-only";

import { supabase } from "@/lib/payments/supabase";
import {
  defaultBotWhitelist,
  mergeBotWhitelist,
  type BotWhitelistState,
} from "@/lib/dashboard/bots";
import type {
  PerUrlRule,
  UserDomainRow,
  UserGlobalSettings,
} from "@/lib/dashboard/settings-types";

export type { PerUrlRule, UserDomainRow, UserGlobalSettings };

function parsePerUrlPricing(raw: unknown): PerUrlRule[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const pattern = String((item as PerUrlRule).pattern ?? "").trim();
      const price = Number((item as PerUrlRule).price);
      if (!pattern || !Number.isFinite(price) || price <= 0) return null;
      return { pattern, price };
    })
    .filter((x): x is PerUrlRule => x != null);
}

function rowToGlobal(row: Record<string, unknown>): UserGlobalSettings {
  return {
    id: String(row.id),
    privy_user_id: String(row.privy_user_id),
    user_wallet: String(row.user_wallet),
    price_per_visit: Number(row.price_per_visit) || 0.001,
    per_url_pricing: parsePerUrlPricing(row.per_url_pricing),
    bot_whitelist: mergeBotWhitelist(row.bot_whitelist),
    network:
      row.network === "polygon" || row.network === "both"
        ? (row.network as UserGlobalSettings["network"])
        : "base",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getOrCreateGlobalSettings(
  privyUserId: string,
  userWallet: string
): Promise<UserGlobalSettings> {
  const { data: existing, error: readErr } = await supabase
    .from("user_settings")
    .select("*")
    .eq("privy_user_id", privyUserId)
    .is("domain", null)
    .maybeSingle();

  if (readErr) throw new Error(readErr.message);
  if (existing) return rowToGlobal(existing as Record<string, unknown>);

  const { data: inserted, error: insertErr } = await supabase
    .from("user_settings")
    .insert([
      {
        privy_user_id: privyUserId,
        user_wallet: userWallet,
        domain: null,
        domain_status: null,
        price_per_visit: 0.001,
        per_url_pricing: [],
        bot_whitelist: defaultBotWhitelist(),
        network: "base",
      },
    ])
    .select("*")
    .single();

  if (insertErr) throw new Error(insertErr.message);
  return rowToGlobal(inserted as Record<string, unknown>);
}

export async function listUserDomains(
  privyUserId: string
): Promise<UserDomainRow[]> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("id, domain, domain_status, created_at")
    .eq("privy_user_id", privyUserId)
    .not("domain", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    domain: String(row.domain),
    domain_status: (row.domain_status === "active" ? "active" : "pending") as
      | "active"
      | "pending",
    created_at: String(row.created_at),
  }));
}

export async function addUserDomain(
  privyUserId: string,
  userWallet: string,
  domain: string
): Promise<UserDomainRow> {
  const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!normalized || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
    throw new Error("Invalid domain");
  }

  const { data, error } = await supabase
    .from("user_settings")
    .insert([
      {
        privy_user_id: privyUserId,
        user_wallet: userWallet,
        domain: normalized,
        domain_status: "pending",
        price_per_visit: 0.001,
        per_url_pricing: [],
        bot_whitelist: defaultBotWhitelist(),
        network: "base",
      },
    ])
    .select("id, domain, domain_status, created_at")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Domain already added");
    throw new Error(error.message);
  }

  return {
    id: String(data.id),
    domain: String(data.domain),
    domain_status: "pending",
    created_at: String(data.created_at),
  };
}

export async function saveGlobalSettings(
  privyUserId: string,
  userWallet: string,
  patch: {
    price_per_visit?: number;
    per_url_pricing?: PerUrlRule[];
    bot_whitelist?: BotWhitelistState;
    network?: "base" | "polygon" | "both";
  }
): Promise<UserGlobalSettings> {
  await getOrCreateGlobalSettings(privyUserId, userWallet);

  const { data, error } = await supabase
    .from("user_settings")
    .update({
      ...patch,
      user_wallet: userWallet,
      updated_at: new Date().toISOString(),
    })
    .eq("privy_user_id", privyUserId)
    .is("domain", null)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToGlobal(data as Record<string, unknown>);
}

export function paymentMatchesDomains(
  pageUrl: string,
  domains: string[]
): boolean {
  if (domains.length === 0) return true;
  const lower = pageUrl.toLowerCase();
  return domains.some(
    (d) => lower.includes(d.toLowerCase()) || lower.includes(`//${d.toLowerCase()}`)
  );
}
