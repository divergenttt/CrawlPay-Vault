import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/auth/require-auth";
import { fetchEmbeddedWalletForPrivyUser } from "@/lib/wallet/privy-user-wallet";
import { settleUsdcFromEmbeddedWallet } from "@/lib/wallet/settle-usdc-on-base";
import type { CrawlPayNetworkId } from "@/lib/networks/chains";
import { isAddress } from "viem";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      to?: string;
      amount_usdc?: number;
      network?: CrawlPayNetworkId;
    };

    const to = body.to?.trim() ?? "";
    const amount = Number(body.amount_usdc);
    const networkId =
      body.network === "polygon" ? "polygon" : ("base" as CrawlPayNetworkId);

    if (!isAddress(to)) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const wallet = await fetchEmbeddedWalletForPrivyUser(auth.session.userId);
    if (!wallet?.walletId) {
      return NextResponse.json({ error: "No embedded wallet" }, { status: 402 });
    }

    const { txHash } = await settleUsdcFromEmbeddedWallet({
      walletId: wallet.walletId,
      recipient: to,
      amountUsdc: amount,
      networkId,
    });

    return NextResponse.json({ tx_hash: txHash });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Withdraw failed" },
      { status: 500 }
    );
  }
}
