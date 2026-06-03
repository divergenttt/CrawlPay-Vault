# CrawlPay

> AI bots read your site for free. Not anymore.

**[crawl-pay.com](https://crawl-pay.com) · [GitHub](https://github.com/divergenttt/CrawlPay-Vault) · [SDK](https://github.com/divergenttt/CrawlPay-Vault-SDK)  · [X](https://x.com/crawlpay) · MIT License**

---

## The Problem

GPTBot, ClaudeBot, PerplexityBot - they crawl your site constantly. They read your articles, your docs, your research, and train models on all of it. You built that content. You get nothing back.

Cloudflare noticed this too and started testing pay-per-crawl - but only for Enterprise customers. Regular developers, bloggers, indie site owners? No option.

That's what CrawlPay is for.

---

## How It Works

### API Key Mode (primary)

Agent sends Bearer token → server checks Base USDC balance → settles on-chain via Privy → content delivered.

```
Agent  →  GET /api/page
          Authorization: Bearer cr_live_...
          User-Agent: GPTBot

Server →  verify key
       →  check Base USDC balance
       →  settle on-chain (Privy)

Server ←→ Base Mainnet (tx confirmed)

Agent  ←  200 OK + content + tx_hash
```

---

### MCP Server

Works with Claude Desktop, Cursor, Windsurf - any MCP-compatible assistant.

**What it does:**
- Detects HTTP 402 responses automatically
- Pays $0.001 USDC per page using your API key
- Returns unlocked content to the agent
- Records on-chain tx_hash for every payment
- Falls back to Base App approval link if no API key

**Add to your mcpServers config:**

```json
{
  "mcpServers": {
    "crawlpay-server": {
      "command": "npx",
      "args": ["-y", "@crawlpay/mcp-server"],
      "env": {
        "CRAWLPAY_API_KEY": "cr_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

**Get your API key →** crawl-pay.com/connect/api-keys

**Available tool:**

`handle_payment_required` - call when a page returns 402.
Inputs: `url` (string), `amount` (string, e.g. "0.001")

---

### Vault Mode (Story CDR)

Standard mode gates public pages. Vault mode goes further - content that doesn't exist in plaintext anywhere. Datasets stored in Story Protocol CDR vaults, cryptographically locked until payment clears.

```
Bot → GET /api/page + X-CrawlPay-Vault: {uuid}
    ← 402 + X-Payment-Required

Bot → GET /api/page + payment-signature
Server → verifySignature → CDR.accessVault(uuid)
Story Protocol → TDH2 threshold decryption → private content
    ← 200 + decrypted dataset
```

The payment is the access condition. No trusted middleman needed.

### x402 Mode (legacy / Arc)

Bot signs EIP-191 payment authorization → Arc settles → content delivered.

```
Bot → GET /api/page
    ← 402 + payment manifest

Bot → GET /api/page + payment-signature
Server → verifySignature → savePayment
    ← 200 + content
```

### Exa + CrawlPay: Full Autonomous Loop

[Exa](https://exa.ai) is a search API built for AI agents with native x402 support - same protocol as CrawlPay.

```
Agent → Exa search ($0.007 USDC, Base network)
     ← ranked results including CrawlPay-protected URLs

Agent → CrawlPay ($0.001 USDC, Arc network)
     ← content, no accounts, no keys, no humans
```

Two independent payment layers, two networks, zero human involvement end to end. This is the economic infrastructure for the agentic web.

```bash
npx tsx scripts/exa-crawlpay-agent.ts "AI payment infrastructure x402"
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Payment network | Base Mainnet (USDC) |
| Payment protocol | x402 |
| Auth | Privy |
| Embedded wallets | Privy (Base) |
| Private data | Story Protocol CDR |
| File storage | IPFS via Pinata |
| Search layer | Exa (x402 native) |
| Agent framework | ElizaOS plugin + MCP server |
| Database | Supabase |
| Frontend | Next.js 14, TypeScript |
| Deploy | Vercel |

---

## Supported AI Bots

`GPTBot` · `ChatGPT-User` · `ClaudeBot` · `anthropic-ai` · `PerplexityBot` · `GoogleOther` · `Google-Extended` · `CCBot` · `Bytespider` · `FacebookBot` · `Applebot-Extended`

---

## Scripts

```bash
npx tsx scripts/simulate-bots.ts          # simulate 200 bot payments (11 bot types)
npx tsx scripts/upload-vault.ts           # upload encrypted content to CDR vault
npx tsx scripts/test-vault-access.ts      # test vault decryption
npx tsx scripts/exa-crawlpay-agent.ts     # run autonomous Exa + CrawlPay agent
npx ts-node scripts/deposit.ts balance    # check Circle Gateway balance
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Auth | Privy app ID |
| `PRIVY_APP_SECRET` | Auth | Privy server secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service key |
| `NEXT_PUBLIC_SELLER_ADDRESS` | Yes | Wallet address (receives payments) |
| `CRAWLPAY_API_KEY_ONCHAIN` | No | `true` for real on-chain Base settlement |
| `STORY_PRIVATE_KEY` | CDR vaults | Story Aeneid wallet private key |
| `STORY_API_URL` | No | Story-API REST endpoint (default: testnet node) |
| `PINATA_JWT` | Vault uploads | Pinata API token for IPFS |
| `PINATA_GATEWAY` | Vault downloads | Dedicated Pinata gateway host |
| `CRAWLPAY_VAULT_UUID` | Vault demo | Vault UUID served via `/api/page` |

Run SQL migrations in order:

1. `supabase/migrations/20260527000000_auth_tables.sql` — `api_keys`, `vault_ownership`, `auth_rate_limits`
2. `supabase/migrations/20260528120000_api_key_usage.sql` — daily spend limits for agent API keys
3. `supabase/migrations/20260528130000_api_keys_wallet.sql` — wallet address on keys (Base balance gate)

Agents use `Authorization: Bearer cr_live_…` on `GET /api/page` (bot User-Agent). Server enforces key limits **and** owner Base USDC balance. Optional `CRAWLPAY_API_KEY_ONCHAIN=true` sends USDC on Base per hit. Arc/x402 headers remain separate - see [docs/AGENTS.md](docs/AGENTS.md).

---

## Security Notes

**Current bot detection** uses User-Agent matching - sufficient for hackathon and early production, not for adversarial environments.

**Planned:** cryptographic request verification, IP range allowlists for known AI crawlers, and anomaly detection to prevent fraud.

**Agent-side protection:** API keys support per-request and daily USDC limits - agents control their own exposure.

---

## Roadmap

**Done**
- [x] Bot detection (11 AI crawlers)
- [x] HTTP 402 + x402 protocol
- [x] Base Mainnet USDC payments (on-chain)
- [x] API Keys system (full cycle)
- [x] MCP server (Base MCP plugin)
- [x] Circle Nanopayments on Arc Testnet
- [x] Privy embedded wallets
- [x] Real-time dashboard (Supabase Realtime)
- [x] CDR vault integration (Story Protocol)
- [x] Exa autonomous agent demo (live API)
- [x] ElizaOS plugin
- [x] Dynamic pricing per path
- [x] Express + Cloudflare Workers adapters
- [x] Modular architecture (arc / cdr / payments / detection)

**Next**
- [ ] ERC-8257 registration (OpenSea Agent Tool Registry)
- [ ] crawlpay.json open standard (like robots.txt for AI payments)
- [ ] Anti-fraud / Sybil protection (IP ranges, rate limits, anomaly detection)
- [ ] Arc Mainnet
- [ ] The Graph subgraph (on-chain indexing)
- [ ] Cross-chain gateway (Li.Fi/LayerZero)
- [ ] Ghost CMS + WordPress plugins
- [ ] LangChain + LlamaIndex loaders

---

## Links

- 🌐 [crawl-pay.com](https://crawl-pay.com)
- 📊 [Dashboard](https://crawl-pay.com/dashboard)
- 💻 [GitHub](https://github.com/divergenttt/CrawlPay-Vault)
- 📦 [SDK](https://github.com/divergenttt/CrawlPay-Vault-SDK)
- 𝕏 [@crawlpay](https://x.com/crawlpay)
- 🔍 [Arc Testnet Explorer](https://testnet.arcscan.app)
- 📖 [Story CDR Docs](https://docs.story.foundation/developers/cdr-sdk/overview)
- 🔎 [Exa x402 Guide](https://exa.ai/docs/reference/x402-guide)

---

*Built on Arc · Circle · Story Protocol · Exa · ElizaOS*
