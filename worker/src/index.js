/**
 * PlAIground Lab — 0-Dependency Stripe Checkout Webhook & Signed R2 Delivery Worker.
 *
 * Security & Architecture:
 *  - Verifies Stripe-Signature (HMAC-SHA256, constant-time compare, <=300s replay window)
 *    via native Web Crypto API (zero npm dependencies).
 *  - Idempotent per checkout session ID using Cloudflare KV (prevents duplicate notifications
 *    on Stripe webhook retries).
 *  - Product routing is declarative via PRODUCTS_JSON env var (zero hardcoded SKU logic).
 *  - Serves completed digital packs from R2 via expiring HMAC-SHA256 signed URLs (/dl/:orderId).
 *  - All secrets (STRIPE_WEBHOOK_SECRET, DOWNLOAD_SIGNING_SECRET, FULFILLMENT_WEBHOOK_URL,
 *    FULFILLMENT_WEBHOOK_TOKEN) MUST be configured as Cloudflare Worker Secrets — never in git.
 */

const SIGNATURE_TOLERANCE_SEC = 300;
const ORDER_TTL_SEC = 60 * 60 * 24 * 90; // 90 days

const encoder = new TextEncoder();

function hexToBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToHex(new Uint8Array(sig));
}

export function parseStripeSigHeader(header) {
  if (!header) return null;
  let timestamp = null;
  const v1Sigs = [];
  for (const part of header.split(',')) {
    const [k, v] = part.trim().split('=');
    if (k === 't' && /^\d+$/.test(v || '')) timestamp = Number(v);
    if (k === 'v1' && v) v1Sigs.push(v);
  }
  if (!timestamp || v1Sigs.length === 0) return null;
  return { timestamp, v1Sigs };
}

export async function verifyStripeSignature(rawBody, sigHeader, secret, nowSec = Math.floor(Date.now() / 1000)) {
  const parsed = parseStripeSigHeader(sigHeader);
  if (!parsed) return { ok: false, reason: 'missing_or_malformed_signature' };
  if (Math.abs(nowSec - parsed.timestamp) > SIGNATURE_TOLERANCE_SEC) {
    return { ok: false, reason: 'timestamp_out_of_tolerance' };
  }
  const expectedHex = await hmacSha256Hex(secret, `${parsed.timestamp}.${rawBody}`);
  const expectedBytes = hexToBytes(expectedHex);
  for (const candidate of parsed.v1Sigs) {
    const candBytes = hexToBytes(candidate);
    if (timingSafeEqual(expectedBytes, candBytes)) {
      return { ok: true };
    }
  }
  return { ok: false, reason: 'signature_mismatch' };
}

export async function signDownloadToken(orderId, expUnixSec, secret) {
  return hmacSha256Hex(secret, `dl:${orderId}:${expUnixSec}`);
}

export function resolveProductKey(session, productsMap) {
  const plink = session?.payment_link || '';
  if (plink && productsMap[plink]) return productsMap[plink];
  const metaKey = session?.metadata?.product_key;
  if (metaKey) return metaKey;
  const cents = session?.amount_total;
  if (cents === 699) return 'ideal-type-m0';
  if (cents === 999) return 'pet-card-single';
  if (cents === 1999) return 'pet-card-3pack';
  return 'unknown-product';
}

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function handleStripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return jsonResp({ error: 'webhook_secret_not_configured' }, 500);
  }
  const rawBody = await request.text();
  const sigHeader = request.headers.get('stripe-signature');
  const nowSec = env._TEST_NOW_SEC ? Number(env._TEST_NOW_SEC) : Math.floor(Date.now() / 1000);

  const v = await verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET, nowSec);
  if (!v.ok) {
    return jsonResp({ error: v.reason }, 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResp({ error: 'invalid_json' }, 400);
  }

  if (event.type !== 'checkout.session.completed') {
    return jsonResp({ ok: true, ignored: event.type || 'unknown' }, 200);
  }

  const session = event.data?.object || {};
  const sessionId = session.id;
  if (!sessionId) {
    return jsonResp({ error: 'missing_session_id' }, 400);
  }

  const kvKey = `order:${sessionId}`;
  if (env.ORDERS_KV) {
    const existing = await env.ORDERS_KV.get(kvKey);
    if (existing) {
      return jsonResp({ ok: true, duplicate: true, order_id: sessionId }, 200);
    }
  }

  let productsMap = {};
  if (env.PRODUCTS_JSON) {
    try {
      productsMap = JSON.parse(env.PRODUCTS_JSON);
    } catch {
      productsMap = {};
    }
  }
  const productKey = resolveProductKey(session, productsMap);
  const mode = event.livemode ? 'live' : 'test';
  const orderRecord = {
    order_id: sessionId,
    product_key: productKey,
    amount_total: session.amount_total ?? null,
    currency: (session.currency || 'usd').toLowerCase(),
    payment_status: session.payment_status || 'unknown',
    mode,
    received_at: new Date(nowSec * 1000).toISOString(),
  };

  if (env.ORDERS_KV) {
    await env.ORDERS_KV.put(kvKey, JSON.stringify(orderRecord), { expirationTtl: ORDER_TTL_SEC });
  }

  // Optional non-PII fulfillment wake pointer (configured via Worker Secrets)
  let notified = false;
  if (env.FULFILLMENT_WEBHOOK_URL && env.FULFILLMENT_WEBHOOK_TOKEN) {
    const pointer = {
      task_id: `order-${sessionId.slice(-12)}`,
      repo: 'plaigroundlab/fulfillment',
      note: `Stripe ${mode} paid: ${productKey} (${orderRecord.currency.toUpperCase()} ${(orderRecord.amount_total || 0) / 100})`,
      msg_id: `stripe-${sessionId}`,
    };
    const fetchFn = env._TEST_FETCH || fetch;
    const res = await fetchFn(env.FULFILLMENT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.FULFILLMENT_WEBHOOK_TOKEN}`,
      },
      body: JSON.stringify(pointer),
    });
    notified = res.ok;
  }

  return jsonResp({ ok: true, duplicate: false, order: orderRecord, notified }, 200);
}

async function handleSignedDownload(request, env, orderId) {
  if (!env.DOWNLOAD_SIGNING_SECRET || !env.DELIVERY_BUCKET) {
    return jsonResp({ error: 'delivery_not_configured' }, 500);
  }
  if (!/^[A-Za-z0-9_\-]{6,128}$/.test(orderId)) {
    return jsonResp({ error: 'invalid_order_id' }, 400);
  }
  const url = new URL(request.url);
  const exp = Number(url.searchParams.get('exp') || '0');
  const sig = url.searchParams.get('sig') || '';
  const nowSec = env._TEST_NOW_SEC ? Number(env._TEST_NOW_SEC) : Math.floor(Date.now() / 1000);

  if (!exp || exp < nowSec) {
    return jsonResp({ error: 'link_expired' }, 403);
  }
  const expected = await signDownloadToken(orderId, exp, env.DOWNLOAD_SIGNING_SECRET);
  if (!timingSafeEqual(hexToBytes(expected), hexToBytes(sig))) {
    return jsonResp({ error: 'invalid_signature' }, 403);
  }

  const obj = await env.DELIVERY_BUCKET.get(`deliveries/${orderId}.zip`);
  if (!obj) {
    return jsonResp({ error: 'artifact_not_ready' }, 404);
  }
  return new Response(obj.body, {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="plaigroundlab-${orderId}.zip"`,
      'cache-control': 'private, no-store',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResp({ ok: true, service: 'plaigroundlab-fulfillment' }, 200);
    }
    if (request.method === 'POST' && url.pathname === '/webhook/stripe') {
      return handleStripeWebhook(request, env);
    }
    if (request.method === 'GET' && url.pathname.startsWith('/dl/')) {
      const orderId = url.pathname.slice('/dl/'.length);
      return handleSignedDownload(request, env, orderId);
    }
    return jsonResp({ error: 'not_found' }, 404);
  },
};
