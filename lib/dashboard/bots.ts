/** Bot catalog for dashboard whitelist UI (12 crawlers). */
export type DashboardBot = {
  id: string;
  label: string;
  company: string;
  glyph: string;
  /** Always allowed without payment — cannot be toggled off. */
  lockedFree?: boolean;
};

export const DASHBOARD_BOTS: DashboardBot[] = [
  { id: "GPTBot", label: "GPTBot", company: "OpenAI", glyph: "GP" },
  { id: "ChatGPT-User", label: "ChatGPT-User", company: "OpenAI", glyph: "CU" },
  { id: "ClaudeBot", label: "ClaudeBot", company: "Anthropic", glyph: "CL" },
  { id: "anthropic-ai", label: "anthropic-ai", company: "Anthropic", glyph: "AN" },
  {
    id: "Googlebot",
    label: "Googlebot",
    company: "Google",
    glyph: "GG",
    lockedFree: true,
  },
  { id: "GoogleOther", label: "GoogleOther", company: "Google", glyph: "GO" },
  { id: "Google-Extended", label: "Google-Extended", company: "Google", glyph: "GE" },
  { id: "PerplexityBot", label: "PerplexityBot", company: "Perplexity", glyph: "PX" },
  { id: "CCBot", label: "CCBot", company: "Common Crawl", glyph: "CC" },
  { id: "Bytespider", label: "Bytespider", company: "ByteDance", glyph: "BY" },
  { id: "FacebookBot", label: "FacebookBot", company: "Meta", glyph: "FB" },
  { id: "Applebot-Extended", label: "Applebot-Extended", company: "Apple", glyph: "AP" },
];

export type BotWhitelistState = Record<
  string,
  { enabled: boolean; free: boolean }
>;

export function defaultBotWhitelist(): BotWhitelistState {
  const state: BotWhitelistState = {};
  for (const bot of DASHBOARD_BOTS) {
    state[bot.id] = {
      enabled: true,
      free: Boolean(bot.lockedFree),
    };
  }
  return state;
}

export function mergeBotWhitelist(raw: unknown): BotWhitelistState {
  const base = defaultBotWhitelist();
  if (!raw || typeof raw !== "object") return base;
  for (const bot of DASHBOARD_BOTS) {
    const entry = (raw as BotWhitelistState)[bot.id];
    if (!entry) continue;
    if (bot.lockedFree) {
      base[bot.id] = { enabled: true, free: true };
      continue;
    }
    base[bot.id] = {
      enabled: Boolean(entry.enabled),
      free: Boolean(entry.free),
    };
  }
  return base;
}
