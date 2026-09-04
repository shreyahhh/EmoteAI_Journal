/**
 * Menstrual-cycle phase modeling and mood correlation.
 *
 * Deterministic, not AI-based, for the same reason as lib/patternAnalysis.js:
 * classifying a calendar day into a cycle phase from the user's own logged
 * periods is arithmetic, and an LLM has no way to do it more accurately than
 * the arithmetic itself. Gemini never sees cycle data.
 *
 * Phase model: the four conventional phases, estimated from the user's own
 * history rather than assumed:
 *   - menstrual:  inside a logged period (or its estimated length, if the
 *                 period has no end date yet)
 *   - follicular: after the period ends, before the fertile window
 *   - ovulation:  a short window centered on the estimated ovulation day
 *   - luteal:     after ovulation, until the next period
 *
 * Ovulation is estimated as (cycle length − luteal length), because the
 * luteal phase is the hormonally fixed part of the cycle (~14 days across
 * most cycle lengths) while the follicular phase is what actually varies
 * cycle to cycle — this is the standard heuristic period-tracking apps use
 * when they don't have hormone/BBT data to pinpoint ovulation directly.
 *
 * All of this is descriptive pattern-spotting for the user's own reference,
 * not a diagnosis or a fertility method — every consumer of this module
 * should keep that framing in its copy.
 */
import { toLocalDateKey, getCreatedAtDate } from './entryDates';
import { moodValence } from './moodBuckets';

const DAY_MS = 86400000;

const DEFAULTS = {
  cycleLengthDays: 28,
  periodLengthDays: 5,
  lutealLengthDays: 14,
};

const MIN_SANE_CYCLE_DAYS = 15;
const MAX_SANE_CYCLE_DAYS = 60;
const FERTILE_WINDOW_RADIUS = 2; // days either side of the estimated ovulation day
export const PMS_WINDOW_DAYS = 5; // trailing days of the luteal phase treated as "pre-menstrual"
const MIN_CYCLES_FOR_ESTIMATE = 2; // completed start-to-start gaps
const MIN_ENTRIES_PER_BUCKET = 3; // for the PMS comparison to be worth showing

export const PHASES = [
  { id: 'menstrual', label: 'Menstrual', color: '#a8432f' },
  { id: 'follicular', label: 'Follicular', color: '#3f8f5f' },
  { id: 'ovulation', label: 'Ovulation', color: '#c9971f' },
  { id: 'luteal', label: 'Luteal', color: '#5b7a9c' },
];

function toEpochDay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

function daysBetween(laterKey, earlierKey) {
  return toEpochDay(laterKey) - toEpochDay(earlierKey);
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function round1(n) {
  return n == null ? null : Math.round(n * 10) / 10;
}

/**
 * Cycle-length/period-length/luteal-length estimated from the user's own
 * logged periods, falling back to textbook averages until there's enough
 * history (two completed cycles) to estimate from.
 */
export function estimateCycleStats(periods) {
  const sorted = [...(periods || [])]
    .filter((p) => p?.startDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const cycleLengths = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = daysBetween(sorted[i].startDate, sorted[i - 1].startDate);
    if (gap >= MIN_SANE_CYCLE_DAYS && gap <= MAX_SANE_CYCLE_DAYS) cycleLengths.push(gap);
  }

  const periodLengths = sorted
    .filter((p) => p.endDate)
    .map((p) => daysBetween(p.endDate, p.startDate) + 1)
    .filter((n) => n > 0 && n <= 14);

  const cycleLengthDays = cycleLengths.length ? Math.round(mean(cycleLengths)) : DEFAULTS.cycleLengthDays;
  const periodLengthDays = periodLengths.length ? Math.round(mean(periodLengths)) : DEFAULTS.periodLengthDays;
  // Luteal phase is the hormonally-fixed part of the cycle; clamp so a short
  // logged cycle can't push ovulation before the period even ends.
  const lutealLengthDays = Math.min(DEFAULTS.lutealLengthDays, Math.max(cycleLengthDays - periodLengthDays - 2, 7));

  return {
    cycleLengthDays,
    periodLengthDays,
    lutealLengthDays,
    cyclesObserved: cycleLengths.length,
    isEstimated: cycleLengths.length >= MIN_CYCLES_FOR_ESTIMATE,
    sortedPeriods: sorted,
  };
}

/**
 * Classifies one calendar day into a phase. Returns null for a day before
 * any logged period (nothing to anchor the estimate to).
 */
export function classifyPhase(dateKey, stats) {
  const { sortedPeriods, cycleLengthDays, periodLengthDays, lutealLengthDays } = stats;
  if (sortedPeriods.length === 0) return null;

  const todayKey = toLocalDateKey(new Date());

  // Inside a logged period (an open-ended period counts through today).
  const insidePeriod = sortedPeriods.some((p) => {
    const end = p.endDate || todayKey;
    return dateKey >= p.startDate && dateKey <= end;
  });
  if (insidePeriod) return 'menstrual';

  // Anchor to the most recent period that started on or before this day.
  let anchor = null;
  let next = null;
  for (const p of sortedPeriods) {
    if (p.startDate <= dateKey) anchor = p;
    else if (!next) next = p;
  }
  if (!anchor) return null; // day is before any tracked period

  const cycleDay = daysBetween(dateKey, anchor.startDate) + 1;
  const effectiveCycleLength = next ? daysBetween(next.startDate, anchor.startDate) : cycleLengthDays;
  const ovulationDay = Math.max(effectiveCycleLength - lutealLengthDays, periodLengthDays + 2);

  if (cycleDay >= ovulationDay - FERTILE_WINDOW_RADIUS && cycleDay <= ovulationDay + FERTILE_WINDOW_RADIUS) {
    return 'ovulation';
  }
  if (cycleDay < ovulationDay - FERTILE_WINDOW_RADIUS) return 'follicular';
  return 'luteal'; // covers both the normal luteal run and a cycle running longer than expected
}

/** True if `dateKey` falls in the trailing PMS_WINDOW_DAYS before the given period's start. */
function isInPmsWindow(dateKey, periodStartDate) {
  const diff = daysBetween(periodStartDate, dateKey);
  return diff >= 1 && diff <= PMS_WINDOW_DAYS;
}

/**
 * Buckets journal entries by cycle phase and reports average tone, mood mix,
 * and top themes per phase — plus a specific pre-menstrual ("PMS-pattern")
 * comparison, since that's the single most commonly asked question.
 *
 * Returns null if there isn't at least one logged period to anchor phases to.
 */
export function analyzeCyclePatterns(entries, periods) {
  const stats = estimateCycleStats(periods);
  if (stats.sortedPeriods.length === 0) return null;

  const buckets = new Map(PHASES.map((p) => [p.id, { entries: [], themeCounts: new Map() }]));
  const pmsWindowValences = [];
  const restOfCycleValences = []; // luteal/follicular/ovulation days outside the PMS window

  entries.forEach((entry) => {
    const date = getCreatedAtDate(entry);
    if (!date || Number.isNaN(date.getTime())) return;
    const dateKey = toLocalDateKey(date);
    const phase = classifyPhase(dateKey, stats);
    if (!phase) return;

    const bucket = buckets.get(phase);
    bucket.entries.push(entry);
    (entry.themes || []).forEach((theme) => bucket.themeCounts.set(theme, (bucket.themeCounts.get(theme) || 0) + 1));

    if (phase !== 'menstrual') {
      const inPmsWindow = stats.sortedPeriods.some((p) => isInPmsWindow(dateKey, p.startDate));
      const v = moodValence(entry);
      if (inPmsWindow) pmsWindowValences.push(v);
      else restOfCycleValences.push(v);
    }
  });

  const phaseBreakdown = PHASES.map(({ id, label, color }) => {
    const bucket = buckets.get(id);
    const valences = bucket.entries.map((e) => moodValence(e));
    const topThemes = [...bucket.themeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([theme]) => theme);
    return {
      id,
      label,
      color,
      count: bucket.entries.length,
      avgSentiment: round1(mean(valences)),
      topThemes,
    };
  });

  let pmsPattern;
  const pmsAvg = mean(pmsWindowValences);
  const restAvg = mean(restOfCycleValences);
  if (pmsWindowValences.length < MIN_ENTRIES_PER_BUCKET || restOfCycleValences.length < MIN_ENTRIES_PER_BUCKET) {
    pmsPattern = {
      detected: false,
      reason: 'not-enough-data',
      sampleSize: pmsWindowValences.length,
    };
  } else {
    const delta = pmsAvg - restAvg;
    pmsPattern = {
      detected: delta <= -1.5,
      avgPreMenstrual: round1(pmsAvg),
      avgRestOfCycle: round1(restAvg),
      delta: round1(delta),
      sampleSize: pmsWindowValences.length,
    };
  }

  return { stats, phaseBreakdown, pmsPattern };
}
