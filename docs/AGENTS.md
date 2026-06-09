# CrawlPay agents — API keys vs Arc x402

## Two payment paths

| Path | Header | Funds |
|------|--------|--------|
| **API key** | `Authorization: Bearer cr_live_…` | Owner's **Base** USDC (embedded wallet) |
| **Arc x402** | `payment-signature` + `payment-bot-address` | Bot wallet on **Arc** |

Create keys at `/connect/api-keys`. Server checks Base balance and daily/per-request limits.

## Supabase migrations (run in order)

1. `supabase/migrations/20260527000000_auth_tables.sql`
2. `supabase/migrations/20260528120000_api_key_usage.sql`
3. `supabase/migrations/20260528130000_api_keys_wallet.sql`
4. `supabase/migrations/20260603000000_payments_network.sql`
5. `supabase/migrations/20260603100000_user_settings.sql`

## Test API key (local or prod)

```bash
curl -s "https://crawl-pay.com/api/page" \
  -H "User-Agent: GPTBot" \
  -H "Authorization: Bearer cr_live_YOUR_KEY"
```

Expect `200` and `"message":"Access granted"`. With zero Base USDC → `402 Insufficient USDC`.

## Env for agents

```env
CRAWLPAY_API_KEY=cr_live_...
```

Optional on-chain settlement (Base USDC → seller):

```env
CRAWLPAY_API_KEY_ONCHAIN=true
NEXT_PUBLIC_SELLER_ADDRESS=0x...
```

## MCP / Eliza

Set `CRAWLPAY_API_KEY` in the environment of the MCP server or agent process. MCP retries protected URLs with the API key when set.

## SDK

External package `@crawlpay/sdk` handles **Arc x402** paywalls on your site. For agent billing against a CrawlPay account wallet, use `lib/agent/crawlpay-fetch.ts` or pass `Authorization: Bearer cr_live_…` on bot requests to `/api/page`.
