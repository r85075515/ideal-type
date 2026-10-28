/*
 * core.js — Ideal Type M0 pairwise preference engine (pure logic, no DOM).
 * Works in the browser (window.IdealTypeCore) and in Node (module.exports)
 * so the exact same code that runs the page is verified by test_core.js.
 *
 * Spec sources:
 *  - v2 report §1.2: 30 rounds max, early finish after 15, skip key (no vote),
 *    same pair never repeats, one face <= 6 appearances per session,
 *    votes < 300ms are down-weighted to 0.3, first 10 rounds stratified random,
 *    round 11+ uncertainty sampling, BT + embedding-centroid dual track,
 *    convergence = cosine(pref_n, pref_n-5) > 0.98 three times in a row.
 *  - v2.1 supplement §3.8: pair score S = U x D,
 *      U(i,j) = 1 - 2*|p(i beats j) - 0.5|   (p from current BT scores)
 *      D(i,j) = min(1, (1 - cos(e_i, e_j)) / poolPairwiseDistanceMedian)
 */
(function (global) {
  'use strict';

  // ---------- small math helpers ----------
  function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function normalize(a) {
    const n = norm(a) || 1;
    return a.map(function (x) { return x / n; });
  }
  function cosine(a, b) {
    const na = norm(a), nb = norm(b);
    if (!na || !nb) return 0;
    return dot(a, b) / (na * nb);
  }
  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

  // Deterministic PRNG (mulberry32) — injectable for reproducible tests.
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  var MAX_ROUNDS = 30;
  var EARLY_FINISH_MIN_ROUNDS = 15;
  var MAX_APPEARANCES = 6;
  var FAST_VOTE_MS = 300;
  var FAST_VOTE_WEIGHT = 0.3;
  var STRATIFIED_ROUNDS = 10; // votes 1..10 stratified random, vote 11+ uncertainty
  var CONVERGENCE_LAG = 5;
  var CONVERGENCE_THRESHOLD = 0.98;
  var CONVERGENCE_STREAK = 3;
  var BT_LEARNING_RATE = 0.5;
  // v2 §1.2: centroid weights grow with round number (mild growth so later
  // votes refine, not overturn, the direction).
  function roundWeight(round) { return 1 + 0.02 * (round - 1); }

  function pairKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }

  /*
   * PairwiseSession — one anonymous voting session.
   * faces: [{ id, embedding: number[], attrs: {...} }, ...]
   * opts: { rng, medianDistance }
   */
  function PairwiseSession(faces, opts) {
    opts = opts || {};
    this.faces = faces;
    this.byId = {};
    faces.forEach(function (f) { this.byId[f.id] = f; }, this);
    this.rng = opts.rng || Math.random;
    this.medianDistance = opts.medianDistance || 1;

    this.round = 0;                 // completed votes
    this.finished = false;
    this.finishReason = null;       // 'converged' | 'max_rounds' | 'manual_early'
    this.scores = {};               // BT log-strength per face id (personal; 0 = global prior fallback)
    this.appearances = {};          // face id -> times shown this session
    faces.forEach(function (f) { this.scores[f.id] = 0; this.appearances[f.id] = 0; }, this);
    this.usedPairs = {};            // pairKey -> true (shown pairs never repeat, incl. skips)
    this.dim = faces[0].embedding.length;
    this.centroidSum = new Array(this.dim).fill(0); // sum of w*(e_winner - e_loser)
    this.snapshots = {};            // round -> normalized preference vector after that round
    this.convergenceStreak = 0;
    this.lastConvergenceCosine = null;
    this.votes = [];                // vote records (incl. p/U/D/S of the pair as selected)
    this.current = null;            // current selection descriptor
    this.selectNext();
  }

  PairwiseSession.prototype.preferenceVector = function () {
    if (norm(this.centroidSum) === 0) return null;
    return normalize(this.centroidSum);
  };

  // BT win probability p(i beats j) from current (personal) BT scores.
  PairwiseSession.prototype.btProbability = function (i, j) {
    return sigmoid(this.scores[i] - this.scores[j]);
  };

  // v2.1 §3.8 pair score components for a candidate pair.
  PairwiseSession.prototype.pairScore = function (i, j) {
    const p = this.btProbability(i, j);
    const U = 1 - 2 * Math.abs(p - 0.5);
    const rawDist = 1 - cosine(this.byId[i].embedding, this.byId[j].embedding);
    const D = Math.min(1, rawDist / this.medianDistance);
    return { p: p, U: U, D: D, S: U * D, rawDistance: rawDist };
  };

  PairwiseSession.prototype.eligiblePairs = function () {
    const out = [];
    for (let a = 0; a < this.faces.length; a++) {
      for (let b = a + 1; b < this.faces.length; b++) {
        const i = this.faces[a].id, j = this.faces[b].id;
        if (this.usedPairs[pairKey(i, j)]) continue;
        if (this.appearances[i] >= MAX_APPEARANCES || this.appearances[j] >= MAX_APPEARANCES) continue;
        out.push([i, j]);
      }
    }
    return out;
  };

  // Strata diversity for the stratified-random phase: pairs from different
  // strata (ethnicity / age band) carry more coverage signal early on.
  PairwiseSession.prototype.strataDiversity = function (i, j) {
    const A = this.byId[i].attrs || {}, B = this.byId[j].attrs || {};
    let d = 0;
    if (A.ethnicity !== B.ethnicity) d++;
    if (A.age_segment !== B.age_segment) d++;
    if (A.face_shape !== B.face_shape) d++;
    return d;
  };

  PairwiseSession.prototype.selectNext = function () {
    if (this.finished) { this.current = null; return null; }
    const pairs = this.eligiblePairs();
    if (!pairs.length) { this.finish('no_pairs_left'); return null; }
    const nextRound = this.round + 1;
    let chosen, reason, score;
    if (nextRound <= STRATIFIED_ROUNDS) {
      // First 10 votes: stratified random — random pick among the most
      // strata-diverse eligible pairs (never a plain uniform draw).
      let best = -1;
      const scored = pairs.map(function (pr) {
        const d = this.strataDiversity(pr[0], pr[1]);
        if (d > best) best = d;
        return { pair: pr, diversity: d };
      }, this);
      const top = scored.filter(function (s) { return s.diversity === best; });
      chosen = top[Math.floor(this.rng() * top.length)].pair;
      reason = 'stratified_random';
      score = this.pairScore(chosen[0], chosen[1]);
    } else {
      // Vote 11+: uncertainty sampling — highest S = U x D wins.
      let bestS = -1;
      chosen = null; score = null;
      pairs.forEach(function (pr) {
        const s = this.pairScore(pr[0], pr[1]);
        if (s.S > bestS) { bestS = s.S; chosen = pr; score = s; }
      }, this);
      reason = 'uncertainty_sampling';
    }
    this.usedPairs[pairKey(chosen[0], chosen[1])] = true;
    this.appearances[chosen[0]]++;
    this.appearances[chosen[1]]++;
    this.current = {
      aId: chosen[0], bId: chosen[1], round: nextRound, reason: reason,
      p: score.p, U: score.U, D: score.D, S: score.S
    };
    return this.current;
  };

  PairwiseSession.prototype.finish = function (reason) {
    this.finished = true;
    this.finishReason = reason;
    this.current = null;
  };

  PairwiseSession.prototype.canFinishEarly = function () {
    return !this.finished && this.round >= EARLY_FINISH_MIN_ROUNDS;
  };
  PairwiseSession.prototype.finishEarly = function () {
    if (!this.canFinishEarly()) return false;
    this.finish('manual_early');
    return true;
  };

  /*
   * Cast a vote on the current pair.
   * winnerId must be one of the two shown faces; reactionMs is the time from
   * pair display to click — under 300ms the vote is down-weighted to 0.3.
   */
  PairwiseSession.prototype.vote = function (winnerId, reactionMs) {
    if (this.finished || !this.current) throw new Error('session not votable');
    const aId = this.current.aId, bId = this.current.bId;
    if (winnerId !== aId && winnerId !== bId) throw new Error('winner not in current pair');
    const loserId = winnerId === aId ? bId : aId;
    const weight = reactionMs < FAST_VOTE_MS ? FAST_VOTE_WEIGHT : 1;
    this.round++;

    // --- Bradley-Terry track: SGD step on log-likelihood ---
    const pWin = this.btProbability(winnerId, loserId);
    const grad = BT_LEARNING_RATE * weight * (1 - pWin);
    this.scores[winnerId] += grad;
    this.scores[loserId] -= grad;

    // --- Centroid track: w_round * (e_winner - e_loser) accumulated ---
    const w = weight * roundWeight(this.round);
    const ew = this.byId[winnerId].embedding, el = this.byId[loserId].embedding;
    for (let k = 0; k < this.dim; k++) this.centroidSum[k] += w * (ew[k] - el[k]);

    const record = {
      round: this.round, aId: aId, bId: bId, winnerId: winnerId, loserId: loserId,
      reactionMs: reactionMs, weight: weight,
      selectionReason: this.current.reason,
      p: this.current.p, U: this.current.U, D: this.current.D, S: this.current.S
    };
    this.votes.push(record);

    // --- Convergence: cosine(pref_n, pref_n-5) > 0.98, 3 in a row ---
    const pref = this.preferenceVector();
    this.snapshots[this.round] = pref;
    const lagSnap = this.snapshots[this.round - CONVERGENCE_LAG];
    if (pref && lagSnap) {
      const c = cosine(pref, lagSnap);
      this.lastConvergenceCosine = c;
      this.convergenceStreak = c > CONVERGENCE_THRESHOLD ? this.convergenceStreak + 1 : 0;
    }
    if (this.convergenceStreak >= CONVERGENCE_STREAK) { this.finish('converged'); return record; }
    if (this.round >= MAX_ROUNDS) { this.finish('max_rounds'); return record; }
    this.selectNext();
    return record;
  };

  // Skip ("neither"): pair is consumed (never repeats) but no vote is cast,
  // the round counter does not advance and the model is not updated.
  PairwiseSession.prototype.skip = function () {
    if (this.finished || !this.current) throw new Error('session not skippable');
    const skipped = { aId: this.current.aId, bId: this.current.bId, atRound: this.round + 1 };
    this.selectNext();
    return skipped;
  };

  // Faces ranked by fit to the learned preference vector (cosine), BT as tiebreak.
  PairwiseSession.prototype.rankedFaces = function () {
    const pref = this.preferenceVector();
    return this.faces.map(function (f) {
      return {
        id: f.id,
        fit: pref ? cosine(pref, f.embedding) : 0,
        btScore: this.scores[f.id],
        appearances: this.appearances[f.id]
      };
    }, this).sort(function (x, y) { return (y.fit - x.fit) || (y.btScore - x.btScore); });
  };

  /*
   * Attribute summary (v2 §1.2 item 3): attribute distribution of the personal
   * Top-N faces by BT score, minus the whole-pool distribution; the largest
   * positive differences are what the user is selecting for.
   */
  PairwiseSession.prototype.attributeSummary = function (topN) {
    topN = topN || 20;
    const dims = ['ethnicity', 'age_segment', 'skin_tone_target', 'face_shape', 'temperament', 'hair_color', 'eye_shape'];
    const self = this;
    const byBt = this.faces.slice().sort(function (a, b) { return self.scores[b.id] - self.scores[a.id]; });
    const top = byBt.slice(0, Math.min(topN, byBt.length));
    const diffs = [];
    dims.forEach(function (dim) {
      const poolDist = {}, topDist = {};
      this.faces.forEach(function (f) { const v = f.attrs[dim]; poolDist[v] = (poolDist[v] || 0) + 1; });
      top.forEach(function (f) { const v = f.attrs[dim]; topDist[v] = (topDist[v] || 0) + 1; });
      Object.keys(topDist).forEach(function (v) {
        const diff = topDist[v] / top.length - (poolDist[v] || 0) / self.faces.length;
        if (diff > 0) diffs.push({ dimension: dim, value: v, diff: diff });
      });
    }, this);
    diffs.sort(function (a, b) { return b.diff - a.diff; });
    return diffs.slice(0, 5);
  };

  PairwiseSession.prototype.confidence = function () {
    return this.finishReason === 'converged' ? 'High' : 'Medium';
  };

  var api = {
    MAX_ROUNDS: MAX_ROUNDS,
    EARLY_FINISH_MIN_ROUNDS: EARLY_FINISH_MIN_ROUNDS,
    MAX_APPEARANCES: MAX_APPEARANCES,
    FAST_VOTE_MS: FAST_VOTE_MS,
    FAST_VOTE_WEIGHT: FAST_VOTE_WEIGHT,
    STRATIFIED_ROUNDS: STRATIFIED_ROUNDS,
    CONVERGENCE_LAG: CONVERGENCE_LAG,
    CONVERGENCE_THRESHOLD: CONVERGENCE_THRESHOLD,
    CONVERGENCE_STREAK: CONVERGENCE_STREAK,
    cosine: cosine, normalize: normalize, sigmoid: sigmoid,
    mulberry32: mulberry32, hashString: hashString, pairKey: pairKey,
    PairwiseSession: PairwiseSession
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.IdealTypeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
