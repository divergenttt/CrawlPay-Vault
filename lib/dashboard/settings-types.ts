import type { BotWhitelistState } from "@/lib/dashboard/bots";
import type { CrawlPayNetworkPreference } from "@/lib/networks/resolve-settlement";

export type PerUrlRule = { pattern: string; price: number };

export type UserGlobalSettings = {
  id: string;
  privy_user_id: string;
  user_wallet: string;
  price_per_visit: number;
  per_url_pricing: PerUrlRule[];
  bot_whitelist: BotWhitelistState;
  network: CrawlPayNetworkPreference;
  created_at: string;
  updated_at: string;
};

export type UserDomainRow = {
  id: string;
  domain: string;
  domain_status: "active" | "pending";
  created_at: string;
};
