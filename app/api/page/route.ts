export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { generateSimulatedTxHash } from "@/lib/arc";
import { getBotName, isAIBot } from "@/lib/detection/bot-detector";
import {
  apiKeyTxHash,
  authorizeApiKeyForAmount,
  commitApiKeyUsage,
} from "@/lib/auth/api-key-access";
import { getApiKeyTokenFromRequest } from "@/lib/auth/api-key-request";
import { verifyArcSignature } from "@/lib/payments/gateway";
import { savePayment } from "@/lib/payments/supabase";

const AMOUNT_USDC = 0.001;

const PAGE_URLS = [
  "/blog/how-ai-works",
  "/docs/getting-started",
  "/articles/machine-learning",
  "/tutorials/nextjs-guide",
  "/about",
  "/",
];

function pickPageUrl(): string {
  return PAGE_URLS[Math.floor(Math.random() * PAGE_URLS.length)];
}

function getHeader(req: NextRequest, ...names: string[]): string | null {
  for (const name of names) {
    const value = req.headers.get(name);
    if (value?.trim()) return value.trim();
  }
  return null;
}

function successResponse(botName: string, tx_hash: string) {
  return NextResponse.json({
    message: "Access granted",
    bot: botName,
    paid: AMOUNT_USDC,
    tx_hash,
  });
}

async function fetchVaultContent(
  uuid: number,
  req: NextRequest
): Promise<{ content: unknown } | null> {
  const vaultUrl = new URL("/api/vault", req.url);
  const res = await fetch(vaultUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Vault API fetch failed:", res.status, errBody);
    return null;
  }

  const data = (await res.json()) as { content?: unknown };
  return data.content !== undefined ? { content: data.content } : null;
}

function paymentRequiredResponse(botName: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const vaultUuid = process.env.CRAWLPAY_VAULT_UUID;

  if (vaultUuid) {
    headers.set("x-crawlpay-vault", vaultUuid);
    headers.set("x-crawlpay-mode", "vault");
  }

  return NextResponse.json(
    {
      error: "payment_required",
      message: "Pay $0.001 USDC to access this content",
      bot: botName,
      price: AMOUNT_USDC,
    },
    { status: 402, headers }
  );
}

export async function GET(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";

  if (!isAIBot(userAgent)) {
    return NextResponse.json({ message: "Welcome human!", free: true });
  }

  const botName = getBotName(userAgent);
  const page_url = pickPageUrl();

  const paymentSignature = getHeader(
    req,
    "payment-signature",
    "PAYMENT-SIGNATURE"
  );
  const paymentBotAddress = getHeader(
    req,
    "payment-bot-address",
    "PAYMENT-BOT-ADDRESS"
  );

  const apiKeyToken = getApiKeyTokenFromRequest(req);
  const hasCryptoHeaders = Boolean(paymentSignature && paymentBotAddress);

  let tx_hash: string;
  let apiKeyName: string | undefined;

  if (apiKeyToken) {
    const access = await authorizeApiKeyForAmount(req, AMOUNT_USDC);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }
    await commitApiKeyUsage(access.key, AMOUNT_USDC);
    tx_hash = apiKeyTxHash(access.key.id);
    apiKeyName = access.key.name;
  } else if (hasCryptoHeaders) {
    const valid = await verifyArcSignature(
      paymentSignature!,
      paymentBotAddress!,
      AMOUNT_USDC,
      page_url
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 401 }
      );
    }

    tx_hash = paymentSignature!.startsWith("0x")
      ? paymentSignature!
      : `0x${paymentSignature!}`;
  } else if (process.env.CRAWLPAY_VAULT_UUID) {
    return paymentRequiredResponse(botName);
  } else {
    tx_hash = generateSimulatedTxHash();
  }

  const vaultHeader = getHeader(req, "x-crawlpay-vault", "X-CrawlPay-Vault");

  try {
    await savePayment({
      bot_name: apiKeyName ? `${botName} [key:${apiKeyName}]` : botName,
      user_agent: userAgent,
      page_url,
      amount_usdc: AMOUNT_USDC,
      tx_hash,
    });

    if (vaultHeader) {
      const vault = await fetchVaultContent(Number(vaultHeader), req);
      if (!vault) {
        return NextResponse.json(
          { error: "Vault unavailable", tx_hash },
          { status: 503 }
        );
      }
      return NextResponse.json({
        message: "Access granted",
        mode: "vault",
        content: vault.content,
        tx_hash,
        bot: botName,
      });
    }

    return successResponse(botName, tx_hash);
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
