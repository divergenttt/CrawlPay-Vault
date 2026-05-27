import { payForContentAction } from "./actions/pay.js";
export const crawlpayPlugin = {
    name: "crawlpay-plugin",
    description: "Detects CrawlPay 402 errors and starts payment resolution flow.",
    actions: [payForContentAction],
};
