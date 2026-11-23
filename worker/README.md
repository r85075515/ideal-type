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

---

## 繁體中文部署與測試指南（Test Mode 優先）

本範本為零外部相依之 Cloudflare Worker，提供 PlAIground Lab 數位商品的付款後自動履約與簽名下載：

- **Webhook 驗簽與付款閘門（`POST /webhook/stripe`）**：使用 Web Crypto HMAC-SHA256 常數時間驗簽與 5 分鐘防重放視窗；僅於 `checkout.session.completed` 或 `checkout.session.async_payment_succeeded` 且 **`payment_status === 'paid'`** 時才寫入訂單並觸發履約通知，未付款之非同步結帳工作階段一律安全忽略。
- **冪等去重**：已處理訂單存入 Cloudflare KV（`order:<session_id>`，90 天 TTL），Stripe 重試不會重複履約。
- **零流出費簽名下載（`GET /dl/:orderId?exp=<unix>&sig=<hex>`）**：自 Cloudflare R2 提供有時效限制的 HMAC 簽名下載。

### 本機離線測試（Node.js 20+）
```bash
node --test worker/tests/test_worker.mjs
```

### 上線前安全檢查表
1. 複製 `wrangler.toml.example` 為本機未追蹤的 `wrangler.toml`，綁定 KV namespace 與 R2 bucket，並於 `PRODUCTS_JSON` 宣告 `payment_link → product_key` 對照表。
2. 透過 `wrangler secret put` 或 Cloudflare Dashboard 設定 Secret（**絕不進 git**）：`STRIPE_WEBHOOK_SECRET`（先填 Test Mode 密鑰）、`DOWNLOAD_SIGNING_SECRET`，以及選配的 `FULFILLMENT_WEBHOOK_URL`、`FULFILLMENT_WEBHOOK_TOKEN`。
3. 確認 `GET /health` 回傳 `200`，並以 Stripe **Test Mode** 重播 `paid` 與 `unpaid` 事件驗證無誤後，再切換至 Live Mode。
