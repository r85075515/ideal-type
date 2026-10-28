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
    var ev = Object.assign({ type: type, ts: new Date().toISOString() }, data || {});
    var all = loadEvents();
    all.push(ev);
    try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) { /* storage full/blocked: console still has it */ }
    console.log('[event]', JSON.stringify(ev));
    queueTelemetry(ev);
  }

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

  // Configurable audience copy (gender track pending — config.js, not HTML).
  document.querySelectorAll('[data-audience-label]').forEach(function (el) { el.textContent = CFG.audienceLabel; });
  document.querySelectorAll('[data-audience-prompt]').forEach(function (el) { el.textContent = CFG.audiencePrompt; });
  document.querySelectorAll('[data-audience-note]').forEach(function (el) { el.textContent = CFG.audienceNote; });
  document.querySelectorAll('[data-ai-disclosure]').forEach(function (el) { el.textContent = CFG.aiDisclosure; });
  $('pay-btn').textContent = 'Unlock for $' + CFG.priceUSD.toFixed(2) + ' →';
  document.querySelector('.paywall h3').textContent = 'Unlock the full version — $' + CFG.priceUSD.toFixed(2);

  // ---------- session ----------
  var session = null;
  var faceById = {};
  var shownAt = 0;
  var paywallLogged = false;

  function attrLine(f) {
    var a = f.attrs;
    return [a.ethnicity, a.age_segment, a.face_shape.split(' with')[0], a.hair_color].join(' · ');
  }

  function renderPair() {
    var cur = session.current;
    if (!cur) return;
    var A = faceById[cur.aId], B = faceById[cur.bId];
    $('img-a').src = A.src; $('img-b').src = B.src;
    $('attrs-a').textContent = attrLine(A);
    $('attrs-b').textContent = attrLine(B);
    $('round-label').textContent = 'Round ' + cur.round + ' of ' + Core.MAX_ROUNDS;
    $('progress-fill').style.width = (session.round / Core.MAX_ROUNDS * 100) + '%';
    $('converge-label').textContent = session.lastConvergenceCosine != null
      ? 'Taste stability: ' + session.lastConvergenceCosine.toFixed(3) : '';
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

  function showResult() {
    var ranked = session.rankedFaces();
    var best = faceById[ranked[0].id];
    var summary = session.attributeSummary(20);
    $('attr-summary').innerHTML = summary.length
      ? summary.map(function (d) {
          return '<li><strong>' + d.value + '</strong> (' + d.dimension.replace(/_/g, ' ') +
            ') — picked +' + Math.round(d.diff * 100) + '% more than the pool average</li>';
        }).join('')
      : '<li>Not enough picks to summarize — your taste stayed broad.</li>';
    $('result-meta').textContent = 'Based on ' + session.round + ' picks · Confidence: ' +
      session.confidence() + ' · Finished by: ' + session.finishReason;
    $('preview-img').src = best.src;
    show('result');
    // Preview + paywall are both on the result view; log both exposures once.
    logEvent('preview_view', { faceId: best.id, fit: ranked[0].fit });
    if (!paywallLogged) {
      paywallLogged = true;
      logEvent('paywall_view', { priceUSD: CFG.priceUSD });
    }
    var note = $('pay-note');
    if (CFG.stripePaymentLink) {
      note.textContent = 'Secure checkout by Stripe. HD + 3 variations are produced after payment.';
    } else {
      note.textContent = 'Prototype: no payment link is configured yet, so checkout is disabled in this build.';
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
      window.location.href = CFG.stripePaymentLink;
    } else {
      $('pay-note').textContent = 'Prototype: Stripe Payment Link is not configured (config.js → stripePaymentLink). No charge was made.';
      var row = $('variant-row');
      var ranked = session.rankedFaces().slice(1, 4);
      row.innerHTML = ranked.map(function (r) {
        return '<img src="' + faceById[r.id].src + '" alt="Variation candidate ' + r.id + ' (AI-generated placeholder)">';
      }).join('');
      $('variants').classList.remove('hidden');
    }
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
      $('start-btn').textContent = 'Could not load the face pool — see README (use a local http server)';
      $('start-btn').disabled = true;
    });
})();
