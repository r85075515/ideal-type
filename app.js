/*
 * app.js — M0 prototype UI wiring.
 * All preference logic lives in core.js (shared with the Node test suite).
 * Events are logged to console + localStorage and can be exported as JSON.
 * Production analytics backend is TBD (v2 suggested PostHog; not decided) —
 * see README "Before launch".
 */
(function () {
  'use strict';
  var CFG = window.M0_CONFIG;
  var Core = window.IdealTypeCore;
  var LS_KEY = 'idealtype_m0_events';

  // ---------- event log ----------
  function loadEvents() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
  }
  function logEvent(type, data) {
    var ev = Object.assign({ type: type, ts: new Date().toISOString() }, data || {}, attribution);
    // Only the waitlist event may carry an email address.
    if (type !== 'waitlist' && 'email' in ev) delete ev.email;
    var all = loadEvents();
    all.push(ev);
    try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) { /* storage full/blocked: console still has it */ }
    console.log('[event]', JSON.stringify(ev));
    queueTelemetry(ev);
  }

  // ---------- first-touch attribution (UTM + referrer) ----------
  // Captured once on the first visit and attached to every event. Values are
  // trimmed, length-capped, and anything that looks like an email is dropped;
  // the referrer is reduced to origin + path (no query string).
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var ATTR_KEY = 'idealtype_m0_attribution';
  function cleanVal(v) {
    v = (v || '').trim().slice(0, 150);
    return v && !/@/.test(v) ? v : null;
  }
  function readAttribution() {
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(ATTR_KEY) || sessionStorage.getItem(ATTR_KEY) || 'null'); } catch (e) { stored = null; }
    if (stored && typeof stored === 'object') return stored;
    var a = {};
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }
    UTM_KEYS.forEach(function (k) { a[k] = params ? cleanVal(params.get(k)) : null; });
    var ref = null;
    try {
      if (document.referrer) { var u = new URL(document.referrer); ref = cleanVal(u.origin + u.pathname); }
    } catch (e) { ref = null; }
    a.referrer = ref;
    a.first_touch_ts = new Date().toISOString();
    var json = JSON.stringify(a);
    try { localStorage.setItem(ATTR_KEY, json); } catch (e) {
      try { sessionStorage.setItem(ATTR_KEY, json); } catch (e2) { /* blocked: keep in memory */ }
    }
    return a;
  }
  var attribution = {};
  try { attribution = readAttribution(); } catch (e) { attribution = {}; }

  // ---------- anonymous telemetry (M0 measurement) ----------
  // Sends the same events (random per-visit session id, no personal data)
  // to CFG.eventEndpoint in batches. Must never break the quiz: every call
  // is guarded, and an empty endpoint disables sending entirely.
  var SID_KEY = 'idealtype_m0_sid';
  var sessionId = 's-anon';
  try {
    sessionId = sessionStorage.getItem(SID_KEY) || '';
    if (!sessionId) {
      sessionId = 's-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(SID_KEY, sessionId);
    }
  } catch (e) { /* private mode etc: keep fallback id */ }
  var telemetryQueue = [];
  function flushTelemetry() {
    if (!CFG.eventEndpoint || !telemetryQueue.length) return;
    var payload = JSON.stringify({ session: sessionId, events: telemetryQueue.splice(0, telemetryQueue.length) });
    try {
      fetch(CFG.eventEndpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: payload, keepalive: true }).catch(function () {});
    } catch (e) { /* ignore */ }
  }
  function queueTelemetry(ev) {
    telemetryQueue.push(ev);
    if (telemetryQueue.length >= 15 || ev.type === 'complete' || ev.type === 'checkout_click') flushTelemetry();
  }
  window.addEventListener('pagehide', flushTelemetry);

  // ---------- DOM ----------
  function $(id) { return document.getElementById(id); }
  var views = { landing: $('landing'), quiz: $('quiz'), result: $('result') };
  function show(name) {
    Object.keys(views).forEach(function (k) { views[k].classList.toggle('hidden', k !== name); });
    window.scrollTo(0, 0);
  }

  // Static UI text is owned by i18n.js ([data-i18n] + applyI18n on boot).
  var T = window.i18nT, TV = window.i18nTV;

  // ---------- session ----------
  var session = null;
  var faceById = {};
  var shownAt = 0;
  var paywallLogged = false;

  function attrLine(f) {
    var a = f.attrs;
    var fs = window.i18nLang() === 'en' ? a.face_shape.split(' with')[0] : TV(a.face_shape);
    return [TV(a.ethnicity), a.age_segment, fs, TV(a.hair_color)].join(' · ');
  }

  function renderPair() {
    var cur = session.current;
    if (!cur) return;
    var A = faceById[cur.aId], B = faceById[cur.bId];
    $('img-a').src = A.src; $('img-b').src = B.src;
    $('attrs-a').textContent = attrLine(A);
    $('attrs-b').textContent = attrLine(B);
    $('round-label').textContent = T('roundLabel', { r: cur.round, n: Core.MAX_ROUNDS });
    $('progress-fill').style.width = (session.round / Core.MAX_ROUNDS * 100) + '%';
    $('converge-label').textContent = session.lastConvergenceCosine != null
      ? T('tasteStability') + session.lastConvergenceCosine.toFixed(3) : '';
    $('early-btn').classList.toggle('hidden', !session.canFinishEarly());
    shownAt = performance.now(); // reaction clock starts when the pair is shown
  }

  function castVote(winnerId) {
    var reactionMs = Math.round(performance.now() - shownAt);
    var rec = session.vote(winnerId, reactionMs);
    logEvent('vote', rec);
    if (session.finished) { finishFlow(); } else { renderPair(); }
  }

  function finishFlow() {
    logEvent('complete', {
      rounds: session.round,
      reason: session.finishReason,
      confidence: session.confidence(),
      lowQualityFlag: session.votes.length > 0 &&
        session.votes.reduce(function (s, v) { return s + v.reactionMs; }, 0) / session.votes.length < Core.FAST_VOTE_MS
    });
    showResult();
  }

  var lastResult = null;
  function renderResultTexts() {
    if (!lastResult) return;
    var summary = lastResult.summary;
    $('attr-summary').innerHTML = summary.length
      ? summary.map(function (d) {
          return '<li><strong>' + TV(d.value) + '</strong> (' + (T('dim_' + d.dimension) || d.dimension) +
            ') — ' + T('summaryLine', { p: Math.round(d.diff * 100) }) + '</li>';
        }).join('')
      : '<li>' + T('summaryEmpty') + '</li>';
    $('result-meta').textContent = T('resultMeta', {
      n: session.round,
      c: T('conf_' + session.confidence()),
      r: T('finish_' + session.finishReason)
    });
    var note = $('pay-note');
    note.textContent = CFG.stripePaymentLink ? T('payNoteLive') : T('payNoteProto');
  }

  function showResult() {
    var ranked = session.rankedFaces();
    var best = faceById[ranked[0].id];
    lastResult = { summary: session.attributeSummary(20), faceId: best.id };
    renderResultTexts();
    $('preview-img').src = best.src;
    show('result');
    // Preview + paywall are both on the result view; log both exposures once.
    logEvent('preview_view', { faceId: best.id, fit: ranked[0].fit, variants: ranked.slice(1, 4).map(function (r) { return r.id; }) });
    if (!paywallLogged) {
      paywallLogged = true;
      logEvent('paywall_view', { priceUSD: CFG.priceUSD });
    }
  }

  // ---------- wiring ----------
  $('start-btn').addEventListener('click', function () {
    paywallLogged = false;
    session = new Core.PairwiseSession(currentFaces, { medianDistance: poolMedian });
    show('quiz');
    renderPair();
  });
  $('face-a').addEventListener('click', function () { if (session && session.current) castVote(session.current.aId); });
  $('face-b').addEventListener('click', function () { if (session && session.current) castVote(session.current.bId); });
  $('skip-btn').addEventListener('click', function () {
    if (!session || session.finished) return;
    var skipped = session.skip();
    logEvent('skip', skipped);
    if (session.finished) { finishFlow(); } else { renderPair(); }
  });
  $('early-btn').addEventListener('click', function () {
    if (session && session.finishEarly()) finishFlow();
  });
  $('pay-btn').addEventListener('click', function () {
    logEvent('checkout_click', { priceUSD: CFG.priceUSD, linkConfigured: !!CFG.stripePaymentLink });
    if (CFG.stripePaymentLink) {
      var sep = CFG.stripePaymentLink.indexOf('?') === -1 ? '?' : '&';
      var utmQs = UTM_KEYS.filter(function (k) {
        return attribution[k] && /^[A-Za-z0-9_-]{1,150}$/.test(attribution[k]); // Stripe-accepted charset
      }).map(function (k) { return '&' + k + '=' + encodeURIComponent(attribution[k]); }).join('');
      window.location.href = CFG.stripePaymentLink + sep + 'client_reference_id=' + encodeURIComponent(sessionId) + utmQs;
    } else {
      $('pay-note').textContent = T('payNoteProto');
      var row = $('variant-row');
      var ranked = session.rankedFaces().slice(1, 4);
      row.innerHTML = ranked.map(function (r) {
        return '<img src="' + faceById[r.id].src + '" alt="Variation candidate ' + r.id + ' (AI-generated placeholder)">';
      }).join('');
      $('variants').classList.remove('hidden');
    }
  });
  var wlBtn = $('wl-btn');
  if (wlBtn) wlBtn.addEventListener('click', function () {
    var em = ($('wl-email').value || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { $('wl-msg').textContent = T('wlBad'); return; }
    logEvent('waitlist', { email: em, faceId: lastResult ? lastResult.faceId : null });
    flushTelemetry();
    $('wl-msg').textContent = T('wlDone');
    $('wl-email').value = '';
  });
  $('restart-btn').addEventListener('click', function () { show('landing'); });
  $('export-btn').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(loadEvents(), null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'idealtype-m0-events.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.addEventListener('i18n:changed', function () {
    if (session && !session.finished && !$('quiz').classList.contains('hidden')) renderPair();
    if (lastResult && !$('result').classList.contains('hidden')) renderResultTexts();
  });

  // ---------- boot ----------
  var currentFaces = [];
  var poolMedian = 1;
  logEvent('landing_view', { page: 'm0-prototype' });
  fetch('pool.json')
    .then(function (r) { return r.json(); })
    .then(function (pool) {
      poolMedian = pool.metadata.pairwise_cosine_distance_median;
      currentFaces = pool.faces;
      currentFaces.forEach(function (f) { faceById[f.id] = f; });
      console.log('[pool] loaded', pool.metadata);
    })
    .catch(function (err) {
      console.error('[pool] failed to load pool.json — serve this folder over http (see README).', err);
      $('start-btn').textContent = T('poolError');
      $('start-btn').disabled = true;
    });
})();
