# CrawlPay

> AI bots read your site for free. Not anymore.

**[crawl-pay.com](https://crawl-pay.com) · [Dashboard](https://crawl-pay.com/dashboard) · [SDK](https://github.com/divergenttt/CrawlPay-Vault-SDK) · MIT License**

---

## The Problem

GPTBot, ClaudeBot, PerplexityBot — they crawl your site constantly. They read your articles, your docs, your research, and train models on all of it. You built that content. You get nothing back.

Cloudflare noticed this too and started testing pay-per-crawl — but only for Enterprise customers. Regular developers, bloggers, indie site owners? No option.

That's what CrawlPay is for.

---

## How It Works

### Standard Mode

A bot visits your page and gets an HTTP 402 response. It signs a payment authorization, Arc settles $0.001 USDC in under a second, and the content is delivered. Your dashboard updates in real time.

```
Bot → GET /api/page
    ← 402 + X-Payment-Required

Bot → GET /api/page + payment-signature
Server → verifySignature → savePayment → Supabase
    ← 200 + content
```

### Vault Mode (Story CDR)

Standard mode gates public pages. Vault mode goes further — content that doesn't exist in plaintext anywhere. Datasets stored in Story Protocol CDR vaults, cryptographically locked until payment clears.

```
Bot → GET /api/page + X-CrawlPay-Vault: {uuid}
    ← 402 + X-Payment-Required

Bot → GET /api/page + payment-signature
Server → verifySignature → CDR.accessVault(uuid)
Story Protocol → TDH2 threshold decryption → private content
    ← 200 + decrypted dataset
```

The payment is the access condition. No trusted middleman needed.

---

## Exa + CrawlPay: Full Autonomous Loop

[Exa](https://exa.ai) is a search API built for AI agents with native x402 support — same protocol as CrawlPay.

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

## Why Arc

| | Ethereum | Arc |
|---|---|---|
| Gas per transaction | ~$0.50 | ~$0.000006 |
| Settlement time | 12 seconds | < 1 second |
| Viable for $0.001 payments | ❌ | ✅ |

On Ethereum, gas costs more than the payment itself. Arc makes $0.001 per crawl economically viable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Payment protocol | x402 + Circle Nanopayments |
| Payment network | Arc Testnet (USDC) |
| Private data | Story Protocol CDR |
| File storage | IPFS via Pinata |
| Search layer | Exa (x402 native) |
| Agent framework | ElizaOS plugin |
| Database | Supabase |
| Auth | Privy |
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

| Variable | Required | Description |
|---|---|---|
| `STORY_PRIVATE_KEY` | CDR vaults | Story Aeneid wallet private key |
| `STORY_API_URL` | No | Story-API REST endpoint (default: testnet node) |
| `PINATA_JWT` | Vault uploads | Pinata API token for IPFS |
| `PINATA_GATEWAY` | Vault downloads | Your dedicated Pinata gateway host |
| `CRAWLPAY_VAULT_UUID` | Vault demo | Vault UUID served via `/api/page` |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Auth | Privy app ID |
| `PRIVY_APP_SECRET` | Auth | Server-side Privy JWT verification |

Run SQL migrations in order:

1. `supabase/migrations/20260527000000_auth_tables.sql` — `api_keys`, `vault_ownership`, `auth_rate_limits`
2. `supabase/migrations/20260528120000_api_key_usage.sql` — daily spend limits for agent API keys
3. `supabase/migrations/20260528130000_api_keys_wallet.sql` — wallet address on keys (Base balance gate)

Agents use `Authorization: Bearer cr_live_…` on `GET /api/page` (bot User-Agent). Server enforces key limits **and** owner Base USDC balance. Optional `CRAWLPAY_API_KEY_ONCHAIN=true` sends USDC on Base per hit. Arc/x402 headers remain separate — see [docs/AGENTS.md](docs/AGENTS.md).

---

## Live Stats

- **2430+ transactions** on Arc Testnet
- **11 unique bot types** detected and charged
- **Real-time dashboard** — Supabase Realtime + polling
- **Gateway balance** display alongside payment history

---

## Roadmap

**Done**
- [x] Bot detection (11 AI crawlers)
- [x] HTTP 402 + x402 protocol
- [x] Circle Nanopayments on Arc Testnet
- [x] Real-time dashboard with Supabase Realtime
- [x] CDR vault integration (Story Protocol)
- [x] Exa autonomous agent demo (live API)
- [x] Dynamic pricing per path
- [x] Express + Cloudflare Workers SDK adapters
- [x] ElizaOS plugin + MCP server
- [x] Privy auth (Google, Twitter, GitHub, Telegram)
- [x] Modular architecture (arc / cdr / payments / detection)

**Next**
- [ ] npm publish `@crawlpay/sdk`
- [ ] Arc Mainnet
- [ ] Tempo, Arbitrum, Solana networks 
- [ ] The Graph subgraph
- [ ] Ghost CMS + WordPress plugins
- [ ] crawlpay.json open standard

---

## Links

- 🌐 [crawl-pay.com](https://crawl-pay.com)
- 📊 [Dashboard](https://crawl-pay.com/dashboard)
- 📦 [SDK](https://github.com/divergenttt/CrawlPay-Vault-SDK)
- 🔍 [Arc Testnet Explorer](https://testnet.arcscan.app)
- 📖 [Story CDR Docs](https://docs.story.foundation/developers/cdr-sdk/overview)
- 🔎 [Exa x402 Guide](https://exa.ai/docs/reference/x402-guide)

---

*Built on Arc · Circle · Story Protocol · Exa · ElizaOS*