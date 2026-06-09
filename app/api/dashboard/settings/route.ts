import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/auth/require-auth";
import { mergeBotWhitelist, type BotWhitelistState } from "@/lib/dashboard/bots";
import {
  addUserDomain,
  getOrCreateGlobalSettings,
  listUserDomains,
  saveGlobalSettings,
  type PerUrlRule,
} from "@/lib/db/user-settings";
import { fetchEmbeddedWalletForPrivyUser } from "@/lib/wallet/privy-user-wallet";

export const dynamic = "force-dynamic";

async function resolveWallet(userId: string): Promise<string> {
  const wallet = await fetchEmbeddedWalletForPrivyUser(userId);
  return wallet?.address ?? "";
}

export async function GET(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const wallet = await resolveWallet(auth.session.userId);
    const settings = await getOrCreateGlobalSettings(
      auth.session.userId,
      wallet
    );
    const domains = await listUserDomains(auth.session.userId);

    return NextResponse.json({ settings, domains, wallet_address: wallet });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      action?: string;
      domain?: string;
      price_per_visit?: number;
      per_url_pricing?: PerUrlRule[];
      bot_whitelist?: BotWhitelistState;
      network?: "base" | "polygon" | "both";
    };

    const wallet = await resolveWallet(auth.session.userId);

    if (body.action === "add_domain") {
      if (!body.domain?.trim()) {
        return NextResponse.json({ error: "Domain required" }, { status: 400 });
      }
      const row = await addUserDomain(
        auth.session.userId,
        wallet,
        body.domain
      );
      return NextResponse.json({ domain: row });
    }

    const price = Number(body.price_per_visit);
    const patch: Parameters<typeof saveGlobalSettings>[2] = {};

    if (Number.isFinite(price) && price > 0) {
      patch.price_per_visit = price;
    }
    if (Array.isArray(body.per_url_pricing)) {
      patch.per_url_pricing = body.per_url_pricing;
    }
    if (body.bot_whitelist) {
      patch.bot_whitelist = mergeBotWhitelist(body.bot_whitelist);
    }
    if (
      body.network === "base" ||
      body.network === "polygon" ||
      body.network === "both"
    ) {
      patch.network = body.network;
    }

    const settings = await saveGlobalSettings(
      auth.session.userId,
      wallet,
      patch
    );

    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 500 }
    );
  }
}
