/**
 * Personalised cycle-aware mood model.
 *
 * Learns, for ONE user, how their mood (the -10..10 sentiment score the text
 * model assigns to each journal entry) varies across their own menstrual cycle,
 * and uses that to (a) say whether a new entry is typical for where she is in
 * her cycle and (b) forecast the coming days.
 *
 * Inputs it reads together (early fusion of the journal text and the period log):
 *   - the text signal: each entry's sentiment score from the emotion model
 *   - the period log: start/end dates (-> cycle day, phase, days to next period)
 *     and the symptoms logged for the period
 *
 * Method: ridge regression on a cyclic encoding of the cycle position (first and
 * second harmonics, so a sharp pre-menstrual dip can be represented) plus
 * period / pre-menstrual / symptom indicators. Ridge shrinks toward the user's
 * own average, so with little data it predicts "about your usual" rather than
 * inventing a pattern.
 *
 * It only claims a pattern when that pattern is OUT-OF-SAMPLE useful: nested
 * leave-one-cycle-out cross-validation must show it beats simply predicting the
 * user's average mood by MIN_IMPROVEMENT_PCT. Otherwise status is
 * 'no-reliable-pattern' and no prediction is offered.
 *
 * Runs entirely in the browser: cycle data never goes to the ML service or to
 * any third-party LLM. Descriptive pattern-spotting for the user's own
 * reference, not a diagnosis or a fertility method.
 */
import { toLocalDateKey, getCreatedAtDate } from './entryDates';
import { moodValence } from './moodBuckets';
import { estimateCycleStats } from './cyclePattern';

const DAY_MS = 86400000;
const MIN_CYCLES = 3; // distinct cycles that have entries
const MIN_DAYS = 20; // distinct journaled days
const MIN_IMPROVEMENT_PCT = 5; // out-of-sample MAE gain over the personal average
const LAMBDAS = [0.5, 1, 2, 5, 10, 20, 50];
const DEFAULT_LAMBDA = 5;
const INTERVAL_Z = 1.28; // ~80% interval
const FLAG_Z = 1.5; // entry must be this many sigmas from expected to be called unusual
const FLAG_MIN_GAP = 2; // ...and at least this many points on the -10..10 scale
const PMS_WINDOW_DAYS = 5;
const FERTILE_RADIUS = 2;
const FEATURE_NAMES = ['intercept', 'sin1', 'cos1', 'sin2', 'cos2', 'period', 'preMenstrual', 'symptoms'];

const toEpochDay = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
};
const daysBetween = (later, earlier) => toEpochDay(later) - toEpochDay(earlier);
const addDays = (key, n) => new Date((toEpochDay(key) + n) * DAY_MS).toISOString().slice(0, 10);
const mean = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
const sd = (v) => {
  if (v.length < 2) return 0;
  const m = mean(v);
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1));
};
const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Where a calendar day sits in the user's cycle. Returns null when it can't be
 * placed (before the first logged period, or well past the expected next
 * period with none logged - an overdue/unknown stretch we don't guess about).
 */
function locate(dateKey, stats, todayKey, defaultSymptoms) {
  const periods = stats.sortedPeriods;
  let idx = -1;
  for (let i = 0; i < periods.length; i += 1) {
    if (periods[i].startDate <= dateKey) idx = i;
    else break;
  }
  if (idx < 0) return null;

  const anchor = periods[idx];
  const next = periods[idx + 1];
  const len = next ? daysBetween(next.startDate, anchor.startDate) : stats.cycleLengthDays;
  const day0 = daysBetween(dateKey, anchor.startDate);

  let cycleDay = day0 + 1;
  let cycleIdx = idx;
  let projected = false; // future date beyond the last logged cycle: wrap using the average length
  if (!next && day0 >= len) {
    if (dateKey <= todayKey) return null;
    cycleDay = (day0 % len) + 1;
    cycleIdx = idx + Math.floor(day0 / len);
    projected = true;
  }

  const P = stats.periodLengthDays;
  const inPeriod = projected || !anchor.endDate ? cycleDay <= P : dateKey <= anchor.endDate;
  const symptomCount = projected ? defaultSymptoms : (anchor.symptoms || []).length;

  return {
    cycleDay,
    cycleLen: len,
    cycleIdx,
    inPeriod,
    daysToNext: len - cycleDay + 1,
    symptomCount: inPeriod ? symptomCount : 0,
  };
}

/** Same phase bands as lib/cyclePattern.js classifyPhase. */
function phaseFor(loc, stats) {
  if (loc.inPeriod) return 'menstrual';
  const ov = Math.max(loc.cycleLen - stats.lutealLengthDays, stats.periodLengthDays + 2);
  if (loc.cycleDay >= ov - FERTILE_RADIUS && loc.cycleDay <= ov + FERTILE_RADIUS) return 'ovulation';
  return loc.cycleDay < ov - FERTILE_RADIUS ? 'follicular' : 'luteal';
}

function features(loc) {
  const theta = (2 * Math.PI * (loc.cycleDay - 1)) / loc.cycleLen;
  return [
    1,
    Math.sin(theta), Math.cos(theta), Math.sin(2 * theta), Math.cos(2 * theta),
    loc.inPeriod ? 1 : 0,
    !loc.inPeriod && loc.daysToNext >= 1 && loc.daysToNext <= PMS_WINDOW_DAYS ? 1 : 0,
    loc.inPeriod ? Math.min(loc.symptomCount, 6) / 6 : 0,
  ];
}

/** Ridge regression via the normal equations; the intercept is not penalised. */
function ridge(X, y, lambda) {
  const p = X[0].length;
  const A = Array.from({ length: p }, () => new Array(p + 1).fill(0));
  X.forEach((row, n) => {
    for (let i = 0; i < p; i += 1) {
      for (let j = 0; j < p; j += 1) A[i][j] += row[i] * row[j];
      A[i][p] += row[i] * y[n];
    }
  });
  for (let i = 1; i < p; i += 1) A[i][i] += lambda;
  A[0][0] += 1e-9; // keep the system solvable if every row is identical

  for (let c = 0; c < p; c += 1) {
    let piv = c;
    for (let r = c + 1; r < p; r += 1) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let r = 0; r < p; r += 1) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= p; k += 1) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => row[p] / row[i]);
}

const predictRow = (w, x) => x.reduce((s, v, i) => s + v * w[i], 0);
const clamp10 = (v) => Math.max(-10, Math.min(10, v));
const groupsOf = (rows) => [...new Set(rows.map((r) => r.group))];

/** Pick lambda by leave-one-cycle-out CV on `rows`. */
function chooseLambda(rows) {
  const groups = groupsOf(rows);
  if (groups.length < 3) return DEFAULT_LAMBDA;
  let best = DEFAULT_LAMBDA;
  let bestErr = Infinity;
  LAMBDAS.forEach((lambda) => {
    let err = 0;
    let n = 0;
    groups.forEach((g) => {
      const train = rows.filter((r) => r.group !== g);
      const test = rows.filter((r) => r.group === g);
      if (!train.length) return;
      const w = ridge(train.map((r) => r.x), train.map((r) => r.y), lambda);
      test.forEach((r) => { err += Math.abs(clamp10(predictRow(w, r.x)) - r.y); n += 1; });
    });
    if (n && err / n < bestErr) { bestErr = err / n; best = lambda; }
  });
  return best;
}

/** Nested leave-one-cycle-out CV: lambda is re-chosen inside every outer fold. */
function crossValidate(rows) {
  const groups = groupsOf(rows);
  const modelErr = [];
  const baseErr = [];
  const residuals = [];
  groups.forEach((g) => {
    const train = rows.filter((r) => r.group !== g);
    const test = rows.filter((r) => r.group === g);
    if (!train.length || !test.length) return;
    const w = ridge(train.map((r) => r.x), train.map((r) => r.y), chooseLambda(train));
    const base = mean(train.map((r) => r.y));
    test.forEach((r) => {
      const pred = clamp10(predictRow(w, r.x));
      modelErr.push(Math.abs(pred - r.y));
      baseErr.push(Math.abs(base - r.y));
      residuals.push(r.y - pred);
    });
  });
  const maeModel = mean(modelErr);
  const maeBaseline = mean(baseErr);
  return {
    maeModel: Math.round(maeModel * 100) / 100,
    maeBaseline: Math.round(maeBaseline * 100) / 100,
    improvementPct: maeBaseline > 0 ? Math.round(((maeBaseline - maeModel) / maeBaseline) * 1000) / 10 : 0,
    residualSd: sd(residuals),
    folds: groups.length,
  };
}

/**
 * @param {Array} entries  journal entries ({createdAt, sentimentScore|mood})
 * @param {Array} periods  period rows ({startDate, endDate, symptoms})
 * @param {{todayKey?: string}} [opts]
 */
export function fitCycleModel(entries, periods, opts = {}) {
  const todayKey = opts.todayKey || toLocalDateKey(new Date());
  const stats = estimateCycleStats(periods);
  const base = { status: 'no-periods', usable: false, n: 0, cyclesUsed: 0, cv: null, stats };
  if (stats.sortedPeriods.length === 0) return base;

  const symptomCounts = stats.sortedPeriods.map((p) => (p.symptoms || []).length);
  const defaultSymptoms = Math.round(mean(symptomCounts));

  // One row per journaled day (a day with several entries counts once).
  const byDay = new Map();
  (entries || []).forEach((entry) => {
    const date = getCreatedAtDate(entry);
    const key = date && !Number.isNaN(date.getTime()) ? toLocalDateKey(date) : null;
    if (!key) return;
    const loc = locate(key, stats, todayKey, defaultSymptoms);
    if (!loc) return;
    const slot = byDay.get(key) || { loc, vals: [] };
    slot.vals.push(moodValence(entry));
    byDay.set(key, slot);
  });
  const rows = [...byDay.entries()].map(([dateKey, { loc, vals }]) => ({
    dateKey, loc, y: mean(vals), group: loc.cycleIdx, x: features(loc),
  }));

  const cyclesUsed = groupsOf(rows).length;
  const out = { ...base, n: rows.length, cyclesUsed, baselineMean: rows.length ? round1(mean(rows.map((r) => r.y))) : null };
  if (rows.length < MIN_DAYS || cyclesUsed < MIN_CYCLES) return { ...out, status: 'not-enough-data', needs: { days: MIN_DAYS, cycles: MIN_CYCLES } };

  const cv = crossValidate(rows);
  const lambda = chooseLambda(rows);
  const w = ridge(rows.map((r) => r.x), rows.map((r) => r.y), lambda);
  const usable = cv.improvementPct >= MIN_IMPROVEMENT_PCT;
  if (!usable) return { ...out, status: 'no-reliable-pattern', cv, lambda };

  const sigma = Math.max(cv.residualSd, 0.5);
  const expectedFor = (loc) => {
    const e = clamp10(predictRow(w, features(loc)));
    return { expected: round1(e), low: round1(clamp10(e - INTERVAL_Z * sigma)), high: round1(clamp10(e + INTERVAL_Z * sigma)) };
  };
  const locFor = (dateKey) => locate(dateKey, stats, todayKey, defaultSymptoms);

  const L = stats.cycleLengthDays;
  const curve = Array.from({ length: L }, (_, i) => {
    const loc = { cycleDay: i + 1, cycleLen: L, inPeriod: i + 1 <= stats.periodLengthDays, daysToNext: L - i, symptomCount: defaultSymptoms };
    return { cycleDay: i + 1, phase: phaseFor(loc, stats), ...expectedFor(loc) };
  });

  return {
    ...out,
    status: 'ready',
    usable: true,
    cv,
    lambda,
    sigma: round1(sigma),
    weights: Object.fromEntries(FEATURE_NAMES.map((n, i) => [n, Math.round(w[i] * 100) / 100])),
    curve,
    /** Expected mood for a calendar day, or null if it can't be placed in the cycle. */
    predict(dateKey) {
      const loc = locFor(dateKey);
      return loc ? { dateKey, cycleDay: loc.cycleDay, phase: phaseFor(loc, stats), ...expectedFor(loc) } : null;
    },
    /** Next `days` days from `fromKey` (default today), each with an ~80% interval. */
    forecast(days = 14, fromKey = todayKey) {
      return Array.from({ length: days }, (_, i) => this.predict(addDays(fromKey, i))).filter(Boolean);
    },
    /** Is this entry's mood typical for where she is in her cycle? */
    assess(entry) {
      const date = getCreatedAtDate(entry);
      const key = date && !Number.isNaN(date.getTime()) ? toLocalDateKey(date) : null;
      const p = key ? this.predict(key) : null;
      if (!p) return null;
      const actual = moodValence(entry);
      const diff = actual - p.expected;
      const z = diff / sigma;
      // Only a clear departure counts: ordinary day-to-day variation sits within
      // about one sigma, so require 1.5 sigma AND a gap big enough to matter.
      const clear = Math.abs(z) >= FLAG_Z && Math.abs(diff) >= FLAG_MIN_GAP;
      return {
        ...p,
        actual: round1(actual),
        z: Math.round(z * 100) / 100,
        verdict: !clear ? 'typical' : diff < 0 ? 'lower-than-usual' : 'higher-than-usual',
      };
    },
  };
}
