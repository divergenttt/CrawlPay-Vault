import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { supabase } from "@/lib/payments/supabase";

export type ApiKeyStatus = "active" | "paused" | "revoked";

export type ApiKeyRow = {
  id: string;
  privy_user_id: string;
  name: string;
  token_prefix: string;
  token_hash: string;
  per_req_usdc: number;
  daily_usdc: number;
  status: ApiKeyStatus;
  created_at: string;
};

export type ApiKeyPublic = {
  id: string;
  name: string;
  tokenPrefix: string;
  perReq: string;
  daily: string;
  created: string;
  status: ApiKeyStatus;
};

export function generateApiToken(): string {
  return `cr_live_${randomBytes(32).toString("hex")}`;
}

export function hashApiToken(token: string): string {
  const pepper =
    process.env.API_KEY_HASH_SECRET?.trim() ||
    process.env.PRIVY_APP_SECRET?.trim() ||
    "dev-only-insecure-pepper";
  return createHash("sha256").update(`${pepper}:${token}`).digest("hex");
}

function tokenPrefix(token: string): string {
  return token.slice(0, 12);
}

function formatDecimal(value: number): string {
  return value.toFixed(value < 0.01 ? 3 : 2);
}

export function toPublicKey(row: ApiKeyRow): ApiKeyPublic {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.token_prefix,
    perReq: formatDecimal(Number(row.per_req_usdc)),
    daily: formatDecimal(Number(row.daily_usdc)),
    created: new Date(row.created_at).toLocaleDateString("en-GB").replace(/\//g, "."),
    status: row.status,
  };
}

export async function listApiKeysForUser(
  privyUserId: string
): Promise<ApiKeyPublic[]> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("privy_user_id", privyUserId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ApiKeyRow[]).map(toPublicKey);
}

export type CreateApiKeyInput = {
  name: string;
  perReqUsdc: number;
  dailyUsdc: number;
};

export async function createApiKeyForUser(
  privyUserId: string,
  input: CreateApiKeyInput
): Promise<{ row: ApiKeyPublic; token: string }> {
  const token = generateApiToken();
  const insert = {
    privy_user_id: privyUserId,
    name: input.name,
    token_prefix: tokenPrefix(token),
    token_hash: hashApiToken(token),
    per_req_usdc: input.perReqUsdc,
    daily_usdc: input.dailyUsdc,
    status: "active" as const,
  };

  const { data, error } = await supabase
    .from("api_keys")
    .insert(insert)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { row: toPublicKey(data as ApiKeyRow), token };
}

export async function updateApiKeyStatus(
  privyUserId: string,
  keyId: string,
  status: ApiKeyStatus
): Promise<boolean> {
  const { data, error } = await supabase
    .from("api_keys")
    .update({ status })
    .eq("id", keyId)
    .eq("privy_user_id", privyUserId)
    .select("id");

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function deleteApiKeyForUser(
  privyUserId: string,
  keyId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("privy_user_id", privyUserId)
    .select("id");

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}
