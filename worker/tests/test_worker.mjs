import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { hmacSha256Hex, signDownloadToken } from '../src/index.js';

function makeMockKV() {
  const store = new Map();
  return {
    async get(k) { return store.has(k) ? store.get(k) : null; },
    async put(k, v) { store.set(k, v); },
    _store: store,
  };
}

function makeMockR2(files = {}) {
  return {
    async get(key) {
      if (!(key in files)) return null;
      return { body: files[key] };
    },
  };
}

async function signedStripeRequest(payloadObj, secret, ts) {
  const raw = JSON.stringify(payloadObj);
  const sig = await hmacSha256Hex(secret, `${ts}.${raw}`);
  return new Request('https://fulfill.plaigroundlab.com/webhook/stripe', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${ts},v1=${sig}`,
    },
    body: raw,
  });
}

test('GET /health returns 200', async () => {
  const res = await worker.fetch(new Request('https://fulfill.plaigroundlab.com/health'), {});
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
});

test('POST /webhook/stripe accepts valid test-mode checkout, dedupes replay, and notifies once', async () => {
  const secret = 'whsec_test_unit_only_12345';
  const nowSec = 1795380000;
  const kv = makeMockKV();
  const notifications = [];
  const env = {
    STRIPE_WEBHOOK_SECRET: secret,
    ORDERS_KV: kv,
    PRODUCTS_JSON: JSON.stringify({ plink_test_pet3: 'pet-card-3pack' }),
    FULFILLMENT_WEBHOOK_URL: 'https://notify.example.test/send',
    FULFILLMENT_WEBHOOK_TOKEN: 'tok_unit_only',
    _TEST_NOW_SEC: nowSec,
    _TEST_FETCH: async (url, init) => {
      notifications.push({ url, body: JSON.parse(init.body) });
      return new Response('{"ok":true}', { status: 201 });
    },
  };

  const event = {
    id: 'evt_test_1',
    type: 'checkout.session.completed',
    livemode: false,
    data: {
      object: {
        id: 'cs_test_petcard_001',
        payment_link: 'plink_test_pet3',
        amount_total: 1999,
        currency: 'usd',
        payment_status: 'paid',
      },
    },
  };

  const res1 = await worker.fetch(await signedStripeRequest(event, secret, nowSec), env);
  assert.equal(res1.status, 200);
  const body1 = await res1.json();
  assert.equal(body1.ok, true);
  assert.equal(body1.duplicate, false);
  assert.equal(body1.order.product_key, 'pet-card-3pack');
  assert.equal(body1.order.mode, 'test');
  assert.equal(body1.notified, true);
  assert.equal(notifications.length, 1);

  // Replay identical session -> idempotent duplicate, ZERO second notification
  const res2 = await worker.fetch(await signedStripeRequest(event, secret, nowSec), env);
  assert.equal(res2.status, 200);
  const body2 = await res2.json();
  assert.equal(body2.duplicate, true);
  assert.equal(notifications.length, 1);
});

test('POST /webhook/stripe ignores unpaid checkout sessions without writing KV or notifying', async () => {
  const secret = 'whsec_test_unit_only_12345';
  const nowSec = 1795380000;
  const kv = makeMockKV();
  const notifications = [];
  const env = {
    STRIPE_WEBHOOK_SECRET: secret,
    ORDERS_KV: kv,
    FULFILLMENT_WEBHOOK_URL: 'https://notify.example.test/send',
    FULFILLMENT_WEBHOOK_TOKEN: 'tok_unit_only',
    _TEST_NOW_SEC: nowSec,
    _TEST_FETCH: async () => {
      notifications.push(true);
      return new Response('{"ok":true}', { status: 201 });
    },
  };

  const unpaidEvent = {
    id: 'evt_test_unpaid',
    type: 'checkout.session.completed',
    livemode: false,
    data: {
      object: {
        id: 'cs_test_unpaid_001',
        amount_total: 1999,
        currency: 'usd',
        payment_status: 'unpaid',
      },
    },
  };

  const res = await worker.fetch(await signedStripeRequest(unpaidEvent, secret, nowSec), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.ignored, 'unpaid_session');
  assert.equal(body.payment_status, 'unpaid');
  assert.equal(kv._store.size, 0);
  assert.equal(notifications.length, 0);
});

test('POST /webhook/stripe rejects invalid signature and expired timestamp', async () => {
  const secret = 'whsec_test_unit_only_12345';
  const nowSec = 1795380000;
  const env = { STRIPE_WEBHOOK_SECRET: secret, _TEST_NOW_SEC: nowSec };
  const event = { type: 'checkout.session.completed', data: { object: { id: 'cs_test_bad' } } };

  // Bad signature
  const badReq = new Request('https://fulfill.plaigroundlab.com/webhook/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': `t=${nowSec},v1=${'0'.repeat(64)}` },
    body: JSON.stringify(event),
  });
  const badRes = await worker.fetch(badReq, env);
  assert.equal(badRes.status, 400);

  // Expired timestamp (>300s old)
  const oldReq = await signedStripeRequest(event, secret, nowSec - 600);
  const oldRes = await worker.fetch(oldReq, env);
  assert.equal(oldRes.status, 400);
});

test('GET /dl/:orderId verifies signed R2 URL expiration and signature', async () => {
  const dlSecret = 'dl_secret_unit_only';
  const nowSec = 1795380000;
  const orderId = 'cs_test_dl_001';
  const env = {
    DOWNLOAD_SIGNING_SECRET: dlSecret,
    DELIVERY_BUCKET: makeMockR2({ [`deliveries/${orderId}.zip`]: 'ZIP_BYTES_OK' }),
    _TEST_NOW_SEC: nowSec,
  };

  // Valid link
  const exp = nowSec + 3600;
  const sig = await signDownloadToken(orderId, exp, dlSecret);
  const okRes = await worker.fetch(new Request(`https://fulfill.plaigroundlab.com/dl/${orderId}?exp=${exp}&sig=${sig}`), env);
  assert.equal(okRes.status, 200);
  assert.equal(await okRes.text(), 'ZIP_BYTES_OK');

  // Expired link -> 403
  const oldExp = nowSec - 10;
  const oldSig = await signDownloadToken(orderId, oldExp, dlSecret);
  const expRes = await worker.fetch(new Request(`https://fulfill.plaigroundlab.com/dl/${orderId}?exp=${oldExp}&sig=${oldSig}`), env);
  assert.equal(expRes.status, 403);

  // Tampered sig -> 403
  const badRes = await worker.fetch(new Request(`https://fulfill.plaigroundlab.com/dl/${orderId}?exp=${exp}&sig=${'a'.repeat(64)}`), env);
  assert.equal(badRes.status, 403);
});
