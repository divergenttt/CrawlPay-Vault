import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrawlPay",
  description: "Monetize your site for the AI era — charge bots $0.001 USDC per page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
