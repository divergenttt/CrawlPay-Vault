# CrawlPay Plugin

## Description
CrawlPay enables AI agents to automatically pay for paywalled web content 
using USDC on Base. When an agent encounters HTTP 402 Payment Required, 
this plugin handles the payment flow automatically.

## Tools

### handle_payment_required
Handles HTTP 402 responses from CrawlPay-protected pages.

**When to use:** Call this tool whenever you receive a 402 Payment Required 
error while trying to read a webpage. The site is protected by CrawlPay 
and requires $0.001 USDC payment per page.

**Inputs:**
- url: The URL that returned 402
- amount: Payment amount in USDC (usually "0.001")

**Flow:**
1. If CRAWLPAY_API_KEY is set: pays automatically via API key, returns content
2. If no API key: returns Base MCP approval link for manual payment

## Setup
Set CRAWLPAY_API_KEY=cr_live_... in your environment for automatic payments.
Get your API key at https://crawl-pay.com/connect/api-keys

## Example
User: "Read this article: example.com/premium/article"
Agent: fetches URL → gets 402 → calls handle_payment_required → pays → returns content
