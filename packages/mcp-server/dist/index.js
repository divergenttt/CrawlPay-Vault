"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const viem_1 = require("viem");
const TOOL_NAME = "handle_payment_required";
const server = new index_js_1.Server({
    name: "crawlpay-server",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
function buildStoredRequest(url, amount) {
    return {
        protocol: "base-mcp",
        version: "0.1.0",
        method: "wallet_sendCalls",
        chainId: "base",
        payment: {
            currency: "USDC",
            amount,
            purpose: "x402 Payment Required",
        },
        context: {
            protectedUrl: url,
            source: "crawlpay-mcp",
            requestedAt: new Date().toISOString(),
        },
    };
}
function buildApprovalLink(storedRequest) {
    const payload = Buffer.from(JSON.stringify(storedRequest)).toString("base64url");
    // Placeholder endpoint until Base publishes the canonical MCP approval URL.
    return `https://example.com/base-mcp/confirm?request=${payload}`;
}
function validateArgs(args) {
    if (!args || typeof args !== "object") {
        throw new Error("Invalid arguments: object expected");
    }
    const { url, amount } = args;
    if (typeof url !== "string" || url.trim().length === 0) {
        throw new Error("Invalid arguments: `url` must be a non-empty string");
    }
    if (typeof amount !== "string" || amount.trim().length === 0) {
        throw new Error("Invalid arguments: `amount` must be a non-empty string");
    }
    // Validate numeric amount format in USDC precision.
    (0, viem_1.parseUnits)(amount, 6);
    return { url: url.trim(), amount: amount.trim() };
}
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    console.error("[crawlpay-mcp] Listing tools");
    return {
        tools: [
            {
                name: TOOL_NAME,
                description: "Handle HTTP 402 payment-required responses and prepare a Base MCP payment approval link.",
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
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`[crawlpay-mcp] Tool call received: ${name}`);
    if (name !== TOOL_NAME) {
        throw new Error(`Unknown tool: ${name}`);
    }
    const { url, amount } = validateArgs(args);
    console.error(`[crawlpay-mcp] 402 context parsed. url=${url} amount=${amount}`);
    // Placeholder "stored request" structure for Base Account wallet flow.
    const storedRequest = buildStoredRequest(url, amount);
    // Current implementation returns a deterministic placeholder approval URL from the
    // encoded request payload. Replace this with production request storage and
    // wallet-session orchestration when CrawlPay payment backend is connected.
    const approvalLink = buildApprovalLink(storedRequest);
    console.error("[crawlpay-mcp] Generated approval link successfully");
    return {
        content: [
            {
                type: "text",
                text: "Payment required detected and prepared.\n" +
                    `Protected URL: ${url}\n` +
                    `Amount: ${amount} USDC\n` +
                    `Approval link: ${approvalLink}`,
            },
        ],
    };
});
async function main() {
    console.error("[crawlpay-mcp] Starting stdio server...");
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("[crawlpay-mcp] Server connected on stdio");
}
main().catch((error) => {
    console.error("[crawlpay-mcp] Fatal startup error:", error);
    process.exit(1);
});
