export type CrawlPayAgentNetwork = "base" | "polygon";
export declare function resolveCrawlPayApiKey(): string | undefined;
export declare function buildAgentHeaders(base?: Record<string, string>, network?: string): Record<string, string>;
export declare function fetchPaidPage(url: string, network?: CrawlPayAgentNetwork): Promise<Response>;
