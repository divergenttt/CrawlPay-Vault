"use client";

import { useRegisterPrivyServerSigner } from "@/lib/wallet/register-privy-server-signer";

/** Auto-registers Privy server signer on the user's embedded wallet after login. */
export function RegisterPrivyServerSigner() {
  useRegisterPrivyServerSigner({ autoRegister: true });
  return null;
}
