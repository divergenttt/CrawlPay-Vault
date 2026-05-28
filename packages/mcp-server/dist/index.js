"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const viem_1 = require("viem");
const crawlpay_fetch_js_1 = require("./crawlpay-fetch.js");
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
    const apiKey = (0, crawlpay_fetch_js_1.resolveCrawlPayApiKey)();
    if (apiKey) {
        console.error("[crawlpay-mcp] Retrying with CrawlPay API key (Base wallet)");
        const res = await (0, crawlpay_fetch_js_1.fetchPaidPage)(url);
        const body = await res.text();
        return {
            content: [
                {
                    type: "text",
                    text: `CrawlPay fetch (${res.status})\n` +
                        `URL: ${url}\n` +
                        `Amount: ${amount} USDC\n` +
                        `Auth: API key (cr_live_…)\n\n` +
                        body.slice(0, 4000),
                },
            ],
        };
    }
    const storedRequest = buildStoredRequest(url, amount);
    const approvalLink = buildApprovalLink(storedRequest);
    console.error("[crawlpay-mcp] No API key — returning Arc/x402 placeholder link");
    return {
        content: [
            {
                type: "text",
                text: "Payment required — set CRAWLPAY_API_KEY=cr_live_… for Base wallet billing,\n" +
                    "or use Arc x402 headers manually.\n\n" +
                    `Protected URL: ${url}\n` +
                    `Amount: ${amount} USDC\n` +
                    `Placeholder approval link: ${approvalLink}`,
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
