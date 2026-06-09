// CrawlPay demo: this is how the SDK is used in a Next.js project

import { crawlpay } from "@crawlpay/sdk";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const sellerAddress = process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim();
const paywallNetwork =
  process.env.CRAWLPAY_NETWORK?.trim().toLowerCase() === "polygon"
    ? "polygon"
    : "base";

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
  // Exclude /connect/* and /dashboard/* (Privy OAuth + heavy client bundles).
  matcher: ["/((?!api|_next|favicon|connect|dashboard|.*\\..*).*)"],
};
