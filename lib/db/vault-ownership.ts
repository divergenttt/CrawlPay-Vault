import "server-only";

import { supabase } from "@/lib/payments/supabase";

export async function registerVaultOwner(
  vaultUuid: number,
  privyUserId: string,
  cid?: string
): Promise<void> {
  const { data: existing, error: readError } = await supabase
    .from("vault_ownership")
    .select("privy_user_id")
    .eq("vault_uuid", vaultUuid)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  if (existing && existing.privy_user_id !== privyUserId) {
    throw new Error("Vault already owned by another user");
  }

  if (existing) {
    const { error } = await supabase
      .from("vault_ownership")
      .update({ cid: cid ?? null })
      .eq("vault_uuid", vaultUuid)
      .eq("privy_user_id", privyUserId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("vault_ownership").insert({
    vault_uuid: vaultUuid,
    privy_user_id: privyUserId,
    cid: cid ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function isVaultOwnedByUser(
  vaultUuid: number,
  privyUserId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("vault_ownership")
    .select("privy_user_id")
    .eq("vault_uuid", vaultUuid)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return false;
  return data.privy_user_id === privyUserId;
}
