# Stripe Fulfillment & Signed R2 Delivery Worker Template

Zero-dependency Cloudflare Worker template for automating post-checkout fulfillment across PlAIground Lab products (`Ideal Type`, `Pet Card`, and future digital packs).

## Features
- **Stripe Webhook Verification (`POST /webhook/stripe`)**: Native Web Crypto HMAC-SHA256 verification with constant-time comparison and 5-minute replay-window guard.
- **Idempotent Deduplication**: Stores processed `checkout.session.completed` IDs in Cloudflare KV (`order:<session_id>`, 90-day TTL) so webhook retries never double-notify.
- **Pointer-Only Fulfillment Alert**: Sends non-PII order summary (`order_id`, `product_key`, amount, `test`/`live` mode) to an optional configured fulfillment endpoint.
- **Expiring Signed R2 Downloads (`GET /dl/:orderId?exp=<unix>&sig=<hex>`)**: Serves digital delivery bundles directly from Cloudflare R2 (zero egress fees) with HMAC-signed expiration links.

## Local Offline Tests (Node.js 20+, Zero Dependencies)
```bash
node --test worker/tests/test_worker.mjs
```

## Safe Test-Mode Rollout Checklist
1. Copy `wrangler.toml.example` to a local untracked `wrangler.toml` and attach your KV namespace + R2 bucket.
2. Configure secrets via `wrangler secret put` or Cloudflare Dashboard (**never commit secrets**):
   - `STRIPE_WEBHOOK_SECRET` (start with Stripe **Test Mode** webhook endpoint secret)
   - `DOWNLOAD_SIGNING_SECRET`
   - Optional: `FULFILLMENT_WEBHOOK_URL`, `FULFILLMENT_WEBHOOK_TOKEN`
3. Verify `GET /health` returns `200 {"ok":true,...}` and replay a Stripe Test Mode `checkout.session.completed` event before enabling live mode.
