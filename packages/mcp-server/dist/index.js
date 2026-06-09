#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const viem_1 = require("viem");
const crawlpay_fetch_1 = require("./crawlpay-fetch");
const TOOL_NAME = "handle_payment_required";
const server = new index_js_1.Server({
    name: "crawlpay-server",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
const SELLER_ADDRESS = process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim() ||
    process.env.SELLER_ADDRESS?.trim() ||
    "0x80B6173DD42a787BbFF2B2617652885a3dE9b05B"; // CrawlPay default
/** Base App deep link — triggers USDC transfer via wallet_sendCalls flow. */
function buildApprovalLink(amount) {
    const params = new URLSearchParams({
        to: SELLER_ADDRESS,
        amount,
        token: "USDC",
        chainId: "8453",
    });
    return `https://www.base.org/send?${params.toString()}`;
}
function validateArgs(args) {
    if (!args || typeof args !== "object") {
        throw new Error("Invalid arguments: object expected");
    }
    const { url, amount, network } = args;
    if (typeof url !== "string" || url.trim().length === 0) {
        throw new Error("Invalid arguments: `url` must be a non-empty string");
    }
    if (typeof amount !== "string" || amount.trim().length === 0) {
        throw new Error("Invalid arguments: `amount` must be a non-empty string");
    }
    let parsedNetwork;
    if (network !== undefined && network !== null && network !== "") {
        if (network !== "base" && network !== "polygon") {
            throw new Error('Invalid arguments: `network` must be "base" or "polygon"');
        }
        parsedNetwork = network;
    }
    // Validate numeric amount format in USDC precision.
    (0, viem_1.parseUnits)(amount, 6);
    return {
        url: url.trim(),
        amount: amount.trim(),
        network: parsedNetwork,
    };
}
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    console.error("[crawlpay-mcp] Listing tools");
    return {
        tools: [
            {
                name: TOOL_NAME,
                description: "Handle HTTP 402 Payment Required from CrawlPay-protected pages. " +
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
                        network: {
                            type: "string",
                            enum: ["base", "polygon"],
                            description: "Optional settlement network: 'base' (default) or 'polygon'",
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
    const { url, amount, network } = validateArgs(args);
    console.error(`[crawlpay-mcp] 402 context parsed. url=${url} amount=${amount} network=${network ?? "default"}`);
    const apiKey = (0, crawlpay_fetch_1.resolveCrawlPayApiKey)();
    if (apiKey) {
        console.error("[crawlpay-mcp] Retrying with CrawlPay API key");
        const res = await (0, crawlpay_fetch_1.fetchPaidPage)(url, network);
        const body = await res.text();
        return {
            content: [
                {
                    type: "text",
                    text: `CrawlPay fetch (${res.status})\n` +
                        `URL: ${url}\n` +
                        `Amount: ${amount} USDC\n` +
                        `Network: ${network ?? process.env.CRAWLPAY_NETWORK ?? "base"}\n` +
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
                text: "Payment required — set CRAWLPAY_API_KEY=cr_live_… for automatic Base wallet billing,\n" +
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
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("[crawlpay-mcp] Server connected on stdio");
}
main().catch((error) => {
    console.error("[crawlpay-mcp] Fatal startup error:", error);
    process.exit(1);
});
