#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { parseUnits } from "viem";
import { fetchPaidPage, resolveCrawlPayApiKey } from "./crawlpay-fetch";

type PaymentArgs = {
  url: string;
  amount: string;
};

const TOOL_NAME = "handle_payment_required";

const server = new Server(
  {
    name: "crawlpay-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const SELLER_ADDRESS =
  process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim() ||
  process.env.SELLER_ADDRESS?.trim() ||
  "0x80B6173DD42a787BbFF2B2617652885a3dE9b05B"; // CrawlPay default

/** Base App deep link — triggers USDC transfer via wallet_sendCalls flow. */
function buildApprovalLink(amount: string): string {
  const params = new URLSearchParams({
    to: SELLER_ADDRESS,
    amount,
    token: "USDC",
    chainId: "8453",
  });
  return `https://www.base.org/send?${params.toString()}`;
}

function validateArgs(args: unknown): PaymentArgs {
  if (!args || typeof args !== "object") {
    throw new Error("Invalid arguments: object expected");
  }

  const { url, amount } = args as Record<string, unknown>;
  if (typeof url !== "string" || url.trim().length === 0) {
    throw new Error("Invalid arguments: `url` must be a non-empty string");
  }

  if (typeof amount !== "string" || amount.trim().length === 0) {
    throw new Error("Invalid arguments: `amount` must be a non-empty string");
  }

  // Validate numeric amount format in USDC precision.
  parseUnits(amount, 6);
  return { url: url.trim(), amount: amount.trim() };
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("[crawlpay-mcp] Listing tools");

  return {
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Handle HTTP 402 Payment Required from CrawlPay-protected pages. " +
          "Call when a webpage returns 402 — pays automatically if CRAWLPAY_API_KEY is set, " +
          "otherwise returns a Base App USDC approval link.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL of the protected page/resource that returned 402",
            },
            amount: {
              type: "string",
              description: 'Requested USDC amount (example: "0.001")',
            },
          },
          required: ["url", "amount"],
          additionalProperties: false,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`[crawlpay-mcp] Tool call received: ${name}`);

  if (name !== TOOL_NAME) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const { url, amount } = validateArgs(args);
  console.error(`[crawlpay-mcp] 402 context parsed. url=${url} amount=${amount}`);

  const apiKey = resolveCrawlPayApiKey();
  if (apiKey) {
    console.error("[crawlpay-mcp] Retrying with CrawlPay API key (Base wallet)");
    const res = await fetchPaidPage(url);
    const body = await res.text();
    return {
      content: [
        {
          type: "text",
          text:
            `CrawlPay fetch (${res.status})\n` +
            `URL: ${url}\n` +
            `Amount: ${amount} USDC\n` +
            `Auth: API key (cr_live_…)\n\n` +
            body.slice(0, 4000),
        },
      ],
    };
  }

  const approvalLink = buildApprovalLink(amount);

  console.error("[crawlpay-mcp] No API key — returning Base App approval link");

  return {
    content: [
      {
        type: "text",
        text:
          "Payment required — set CRAWLPAY_API_KEY=cr_live_… for automatic Base wallet billing,\n" +
          "or approve USDC payment via Base App:\n\n" +
          `Protected URL: ${url}\n` +
          `Amount: ${amount} USDC\n` +
          `Base approval link: ${approvalLink}`,
      },
    ],
  };
});

async function main() {
  console.error("[crawlpay-mcp] Starting stdio server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[crawlpay-mcp] Server connected on stdio");
}

main().catch((error) => {
  console.error("[crawlpay-mcp] Fatal startup error:", error);
  process.exit(1);
});
