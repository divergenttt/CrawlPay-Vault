import { NextRequest, NextResponse } from "next/server";
import { generateSimulatedTxHash } from "@/lib/arc";
import { accessVault } from "@/lib/cdr/vault";
import { getBotName, isAIBot } from "@/lib/detection/bot-detector";
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

  const hasCryptoHeaders = Boolean(paymentSignature && paymentBotAddress);

  let tx_hash: string;

  if (hasCryptoHeaders) {
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
      bot_name: botName,
      user_agent: userAgent,
      page_url,
      amount_usdc: AMOUNT_USDC,
      tx_hash,
    });

    if (vaultHeader) {
      try {
        const decrypted = await accessVault(Number(vaultHeader));
        return NextResponse.json({
          message: "Access granted",
          mode: "vault",
          content: JSON.parse(decrypted) as unknown,
          tx_hash,
          bot: botName,
        });
      } catch (vaultErr) {
        console.error(
          "Vault access failed:",
          vaultErr instanceof Error ? vaultErr.message : vaultErr
        );
        return NextResponse.json(
          { error: "Vault unavailable", tx_hash },
          { status: 503 }
        );
      }
    }

    return successResponse(botName, tx_hash);
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
