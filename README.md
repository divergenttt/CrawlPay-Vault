# CrawlPay

> AI bots read your site for free. Not anymore.

**[Live Demo](crawl-pay.com) · [Dashboard]([https://crawl-pay.vercel.app/dashboard]) · [SDK](https://github.com/divergenttt/CrawlPay-SDK) · MIT License**

---

## The Problem

AI Bot crawl your site thousands of times a day. They read your articles, your docs, your content. They train models on it. And they pay you nothing.

Cloudflare noticed this too. They started testing pay-per-crawl for AI bots - but only for Enterprise customers. Regular developers, bloggers, indie site owners? No option.

That's what CrawlPay is for.

---

## What's New in This Version

This repository extends the original CrawlPay with two new layers:

**CDR Vaults** - private encrypted content via Story Protocol. Instead of just gating public pages, bots can now pay to access genuinely private datasets stored in on-chain vaults. The content is cryptographically locked until payment clears.

**Exa Integration** - a working demo of the full autonomous payment loop. An AI agent uses Exa to search the web, finds CrawlPay-protected URLs, and pays for each one - no API keys, no human involvement, zero accounts.

---

## How It Works

### Standard Mode

```
Bot → GET /api/page
    ← 402 + X-Payment-Required

Bot → GET /api/page + payment-signature
Server → verifySignature → savePayment → Supabase
    ← 200 + content

Dashboard updates in real-time
```

### Vault Mode (Story CDR)

```
Bot → GET /api/page + X-CrawlPay-Vault: {uuid}
    ← 402 + X-Payment-Required

Bot → GET /api/page + payment-signature
Server → verifySignature → CDR.accessVault(uuid)
Story Protocol → threshold decryption → private content
    ← 200 + decrypted dataset
```

The difference: standard mode gates public pages. Vault mode delivers content that doesn't exist anywhere in plaintext - it's encrypted at rest and only decrypts after verified payment.

---

## Exa + CrawlPay: Full Autonomous Stack

[Exa](https://exa.ai) is a search API built for AI agents. They also support x402 natively - agents pay per search with USDC, no API key needed.

Put them together:

```
Agent → Exa search ($0.007 USDC, Base network)
     ← ranked results including CrawlPay-protected URLs

Agent → CrawlPay ($0.001 USDC, Arc network)
     ← content, no accounts, no keys, no humans
```

This is what the agentic web looks like. Two independent payment layers, both x402, both USDC, zero human involvement end to end.

Run the demo:

```bash
npx tsx scripts/exa-crawlpay-agent.ts "AI payment infrastructure x402"
```

---

## Why Arc

|                          | Ethereum  | Arc         |
|--------------------------|-----------|-------------|
| Gas per transaction      | ~$0.50    | ~$0.000006  |
| Settlement time          | 12 seconds| < 1 second  |
| Viable for $0.001 payments | ❌      | ✅          |

On Ethereum, gas costs more than the payment itself. Arc makes $0.001 per crawl actually work.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Payment protocol | x402 + Circle Nanopayments |
| Payment network | Arc Testnet (USDC) |
| Private data | Story Protocol CDR |
| File storage | IPFS via Pinata |
| Search layer | Exa (x402 native) |
| Database | Supabase |
| Frontend | Next.js 14, TypeScript |
| Deploy | Vercel |

---

## Supported AI Bots

· GPTBot 
· ChatGPT-User 
· ClaudeBot 
· anthropic-ai 
· PerplexityBot 
· GoogleOther 
· Google-Extended 
· CCBot 
· Bytespider 
· FacebookBot 
· Applebot-Extended

---

## Environment Variables

Copy `.env.local` from your secrets store. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `STORY_PRIVATE_KEY` | For CDR vaults | Story Aeneid wallet private key |
| `STORY_RPC_URL` | No | Story EVM RPC (default: `https://aeneid.storyrpc.io`) |
| `STORY_API_URL` | No | Story-API REST endpoint for CDR DKG state ([CDR runtime config](https://docs.story.foundation/developers/cdr-sdk/advanced-configuration); default: `https://api.story.foundation`). On Aeneid, if the default is unreachable, set to the shared testnet Story-API URL from the docs. |
| `PINATA_JWT` | For vault uploads | Pinata API token for IPFS |
| `CRAWLPAY_VAULT_UUID` | For vault demo | Vault UUID to serve via `/api/page` |

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

## Live Stats

- **2418+ transactions** on Arc Testnet
- **11 unique bot types** detected and charged
- **Real-time dashboard** - stats refresh every 30s, payments every 5s
- **Gateway balance** display alongside payment history

---

## Roadmap

**Done**
- [x] Bot detection (11 AI crawlers)
- [x] HTTP 402 + x402 protocol
- [x] Circle Nanopayments on Arc Testnet
- [x] Real-time dashboard with aggregate stats
- [x] CDR vault integration (Story Protocol)
- [x] Exa autonomous agent demo
- [x] Paginated payments API
- [x] Modular architecture (arc/cdr/payments/detection)

**Next**
- [ ] Arc Mainnet
- [ ] Express/Fastify/Cloudflare Workers SDK adapters
- [ ] npm publish as `@crawlpay/sdk`
- [ ] Exa real API integration (replace simulated search)
- [ ] Platform fee (5–10% per transaction)

---

## Links

- 🌐 [Live Demo](https://crawl-pay.vercel.app)
- 📊 [Dashboard](https://crawl-pay.vercel.app/dashboard)
- 📦 [CrawlPay SDK](https://github.com/divergenttt/CrawlPay-SDK)
- 🔍 [Arc Testnet Explorer](https://testnet.arcscan.app)
- 📖 [Story CDR Docs](https://docs.story.foundation/developers/cdr-sdk/overview)
- 🔎 [Exa x402 Guide](https://exa.ai/docs/reference/x402-guide)

---

*Built on Arc · Story Protocol · Exa · Circle Nanopayments*
