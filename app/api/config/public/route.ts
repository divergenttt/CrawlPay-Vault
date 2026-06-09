import { NextResponse } from "next/server";
import { getNetworkConfig } from "@/lib/networks/chains";
import {
  getNetworkHeaderFromRequest,
  getDefaultSettlementNetworkId,
  parseNetworkPreference,
  resolveSettlementNetworks,
} from "@/lib/networks/resolve-settlement";
import { getPrivySignerQuorumId } from "@/lib/wallet/privy-signer-quorum-id";
import {
  hasPrivyAuthorizationPrivateKey,
  isPrivyOnchainServerConfigured,
} from "@/lib/wallet/privy-onchain-config";
import { isApiKeyOnchainEnabled } from "@/lib/wallet/settle-usdc-on-base";

export const dynamic = "force-dynamic";

/** Runtime public config (avoids rebuild when NEXT_PUBLIC_* changes on Vercel). */
export async function GET() {
  const networkPreference = parseNetworkPreference(
    process.env.CRAWLPAY_NETWORK ?? process.env.NEXT_PUBLIC_CRAWLPAY_NETWORK
  );

  return NextResponse.json({
    onchainApiKeys: isApiKeyOnchainEnabled(),
    privySignerQuorumId: getPrivySignerQuorumId() ?? null,
    authorizationPrivateKeyConfigured: hasPrivyAuthorizationPrivateKey(),
    onchainServerConfigured: isPrivyOnchainServerConfigured(),
    network: getDefaultSettlementNetworkId(),
    networkPreference,
    settlementNetworks: resolveSettlementNetworks(networkPreference),
    chainId: getNetworkConfig(getDefaultSettlementNetworkId()).chainId,
  });
}
