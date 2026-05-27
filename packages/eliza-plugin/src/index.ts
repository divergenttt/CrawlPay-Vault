import type { Plugin } from "@elizaos/core";
import { payForContentAction } from "./actions/pay.js";

export const crawlpayPlugin: Plugin = {
  name: "crawlpay-plugin",
  description: "Detects CrawlPay 402 errors and starts payment resolution flow.",
  actions: [payForContentAction],
};
