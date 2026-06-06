// CrawlPay demo: this is how the SDK is used in a Next.js project

import { crawlpay } from "@crawlpay/sdk";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { resolveNetworkId } from "@/lib/networks/chains";

const sellerAddress = process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim();
const paywallNetwork = resolveNetworkId(process.env.CRAWLPAY_NETWORK);

const paywall = crawlpay({
  wallet: sellerAddress ?? "",
  price: "0.001",
  network: paywallNetwork,
});

export function middleware(request: NextRequest) {
  if (!sellerAddress) {
    console.error(
      "CrawlPay middleware: set NEXT_PUBLIC_SELLER_ADDRESS in .env.local"
    );
    return NextResponse.next();
  }

  return paywall(request) ?? NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  // Exclude /connect/* so OAuth callbacks are not intercepted by the x402 paywall.
  matcher: ["/((?!api|_next|favicon|connect|.*\\..*).*)"],
};
