import type {
  Action,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
} from "@elizaos/core";

import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mcpServerPath = resolve(__dirname, "../../../mcp-server/dist/index.js");

let mcpClientPromise: Promise<Client> | null = null;

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function hasPaymentRequiredSignal(input: string): boolean {
  const normalized = input.toLowerCase();
  return normalized.includes("payment required") || /\b402\b/.test(normalized);
}

function extractUrl(input: string): string | null {
  const match = input.match(/https?:\/\/[^\s"'<>()]+/i);
  return match?.[0] ?? null;
}

function extractAmount(input: string): string | null {
  const usdc = input.match(/\$?\s*([0-9]+(?:\.[0-9]+)?)\s*usdc/i);
  if (usdc) return usdc[1];

  const amountHeader = input.match(/amount\s*=\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (amountHeader) return amountHeader[1];

  return null;
}

async function getMcpClient(): Promise<Client> {
  if (!mcpClientPromise) {
    mcpClientPromise = (async () => {
      const transport = new StdioClientTransport({
        command: "node",
        args: [mcpServerPath],
      });

      const client = new Client(
        { name: "eliza-crawlpay-client", version: "0.1.0" },
        { capabilities: {} }
      );

      await client.connect(transport);
      return client;
    })().catch((error) => {
      mcpClientPromise = null;
      throw error;
    });
  }

  return mcpClientPromise;
}

export const payForContentAction: Action = {
  name: "PAY_FOR_CONTENT",
  description:
    "Detect CrawlPay 402 payment gates and initiate payment flow via MCP.",
  similes: ["PAYMENT_REQUIRED", "PAY_FOR_PAGE", "UNLOCK_PAID_CONTENT"],
  examples: [
    [
      {
        user: "user",
        content: {
          text: "I tried to fetch https://example.com/dataset.json and got 402 Payment Required.",
        },
      },
      {
        user: "assistant",
        content: {
          text: "I detected a CrawlPay gate and will trigger the payment flow.",
          action: "PAY_FOR_CONTENT",
        },
      },
    ],
    [
      {
        user: "user",
        content: {
          text: "Response says payment required, amount=0.001 USDC. Can you proceed?",
        },
      },
      {
        user: "assistant",
        content: {
          text: "Understood. I will request a payment approval link.",
          action: "PAY_FOR_CONTENT",
        },
      },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory, state?: State) => {
    const messageText = stringifyUnknown((message as { content?: unknown }).content);
    const stateText = stringifyUnknown(state);
    return hasPaymentRequiredSignal(`${messageText}\n${stateText}`);
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    _options?: Record<string, unknown>,
    callback?: HandlerCallback
  ) => {
    const combinedContext = [
      stringifyUnknown((message as { content?: unknown }).content),
      stringifyUnknown(state),
    ].join("\n");

    const targetUrl = extractUrl(combinedContext) ?? "unknown-url";
    const amount = extractAmount(combinedContext) ?? "unknown-amount";

    console.log("[CrawlPay][PAY_FOR_CONTENT] 402/payment_required detected");
    console.log(`[CrawlPay][PAY_FOR_CONTENT] Target URL: ${targetUrl}`);
    console.log(`[CrawlPay][PAY_FOR_CONTENT] Requested amount: ${amount}`);

    let responseText = "";

    try {
      const mcpClient = await getMcpClient();

      const response = await mcpClient.callTool({
        name: "handle_payment_required",
        arguments: { url: targetUrl, amount: amount },
      });

      // MCP response should contain a user-presentable payment link in content
      responseText =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
    } catch (err: unknown) {
      console.error("[CrawlPay][PAY_FOR_CONTENT] MCP connection failed", err);
      responseText =
        "Error: unable to connect to the CrawlPay MCP server for payment handling. Please try again later.";
    }

    await callback?.({
      text:
        `Payment required for protected content.\n` +
        `URL: ${targetUrl}\n` +
        `Amount: ${amount}\n` +
        `\n${responseText}`,
    });

    return true;
  },
};
