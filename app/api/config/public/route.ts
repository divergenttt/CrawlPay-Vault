import { NextResponse } from "next/server";
import { getPrivySignerQuorumId } from "@/lib/wallet/privy-signer-quorum-id";
import {
  hasPrivyAuthorizationPrivateKey,
  isPrivyOnchainServerConfigured,
} from "@/lib/wallet/privy-onchain-config";
import { isApiKeyOnchainEnabled } from "@/lib/wallet/settle-usdc-on-base";

export const dynamic = "force-dynamic";

/** Runtime public config (avoids rebuild when NEXT_PUBLIC_* changes on Vercel). */
export async function GET() {
  return NextResponse.json({
    onchainApiKeys: isApiKeyOnchainEnabled(),
    privySignerQuorumId: getPrivySignerQuorumId() ?? null,
    authorizationPrivateKeyConfigured: hasPrivyAuthorizationPrivateKey(),
    onchainServerConfigured: isPrivyOnchainServerConfigured(),
  });
}
