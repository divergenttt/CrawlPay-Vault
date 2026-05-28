"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCrawlPayApiKey = resolveCrawlPayApiKey;
exports.buildAgentHeaders = buildAgentHeaders;
exports.fetchPaidPage = fetchPaidPage;
function resolveCrawlPayApiKey() {
    const key = process.env.CRAWLPAY_API_KEY?.trim() ||
        process.env.CRAWLPAY_AGENT_API_KEY?.trim();
    return key?.startsWith("cr_live_") ? key : undefined;
}
function buildAgentHeaders(base = {}) {
    const headers = {
        "User-Agent": process.env.CRAWLPAY_BOT_USER_AGENT ??
            "GPTBot (CrawlPay-MCP/1.0)",
        ...base,
    };
    const apiKey = resolveCrawlPayApiKey();
    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }
    return headers;
}
async function fetchPaidPage(url) {
    const apiKey = resolveCrawlPayApiKey();
    const first = await fetch(url, {
        headers: buildAgentHeaders(),
        cache: "no-store",
    });
    if (apiKey || first.status !== 402) {
        return first;
    }
    const botAddress = process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim() ?? "";
    return fetch(url, {
        headers: {
            ...buildAgentHeaders(),
            "payment-signature": "0xsimulated",
            "payment-bot-address": botAddress,
            ...(first.headers.get("x-crawlpay-vault")
                ? { "x-crawlpay-vault": first.headers.get("x-crawlpay-vault") }
                : {}),
        },
        cache: "no-store",
    });
}
