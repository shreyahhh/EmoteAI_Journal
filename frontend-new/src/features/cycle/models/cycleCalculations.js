/**
 * Cycle v2 phase/prediction logic — the exact rules from the Cycle v2 design
 * spec (section 4), kept deterministic and dependency-free so it's trivial to
 * unit test. Supersedes the older heuristic in ./cyclePattern.js for the
 * Cycle mini-app's own UI (cyclePattern.js's estimateCycleStats is still used
 * by ./cycleModel.js's mood-forecast model, which is unrelated feature
 * engineering and keeps its own convention).
 *
 * Phase rule:
 *   - menstrual:  inside a logged period (or, for an open/ongoing period,
 *                 from its start through today)
 *   - ovulation day = next expected period start − 14
 *   - ovulatory:  ovulation day ± 1
 *   - follicular: period end .. ovulatory start − 1
 *   - luteal:     ovulatory end + 1 .. next period start − 1
 *
 * All of this is descriptive pattern-spotting for the user's own reference,
 * not a diagnosis or a fertility method — copy built on top of this module
 * should keep that framing (see PREDICTION_DISCLAIMER).
 */
import { toLocalDateKey } from '../../../lib/models/entryDates';

const DAY_MS = 86400000;
const MAX_CYCLES_FOR_AVERAGE = 6;
const MIN_COMPLETED_CYCLES_FOR_REAL_AVERAGE = 2;
const IRREGULAR_VARIATION_THRESHOLD_DAYS = 7;
const OVULATION_DAYS_BEFORE_NEXT_PERIOD = 14;
const OVULATORY_RADIUS_DAYS = 1;
const FERTILE_WINDOW_BEFORE_OVULATION_DAYS = 5;
const FERTILE_WINDOW_AFTER_OVULATION_DAYS = 1;
const PMS_WINDOW_DAYS = 5;
const LATE_PERIOD_THRESHOLD_DAYS = 3;
const PERIOD_END_PROMPT_AFTER_DAYS = 10;
const MIN_SANE_CYCLE_DAYS = 15;
const MAX_SANE_CYCLE_DAYS = 90;

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;

export const PHASES = [
  { id: 'menstrual', label: 'Menstrual', color: '#D9909A', textOn: '#2A1416' },
  { id: 'follicular', label: 'Follicular', color: '#9CC3A6', textOn: '#14100C' },
  { id: 'ovulatory', label: 'Ovulatory', color: '#F0B866', textOn: '#2A1A0C' },
  { id: 'luteal', label: 'Luteal', color: '#B7A6DE', textOn: '#14100C' },
];
const phaseMeta = Object.fromEntries(PHASES.map((p) => [p.id, p]));
export function getPhaseMeta(phaseId) {
  return phaseMeta[phaseId] || null;
}

export const PREDICTION_DISCLAIMER = 'Estimates from your past cycles. Not a method of contraception.';

function toEpochDay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}
export function daysBetween(laterKey, earlierKey) {
  return toEpochDay(laterKey) - toEpochDay(earlierKey);
}
function keyToLocalDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}
/** Add `n` (possibly negative) calendar days to a 'YYYY-MM-DD' key, in local time. */
export function addDays(dateKey, n) {
  const d = keyToLocalDate(dateKey);
  d.setDate(d.getDate() + n);
  return toLocalDateKey(d);
}
function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function sortPeriods(periods) {
  return [...(periods || [])]
    .filter((p) => p?.startDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Cycle-length/period-length averages, variation and irregular-mode
 * detection — from the last up to 6 *completed* cycles (a start-to-start
 * gap we actually have both ends of). Falls back to the setup values from
 * CycleSettings until 2 real completed cycles exist.
 */
export function computeCycleStats(periods, settings = {}) {
  const sorted = sortPeriods(periods);
  const setupCycleLength = settings.avgCycleLength || DEFAULT_CYCLE_LENGTH;
  const setupPeriodLength = settings.avgPeriodLength || DEFAULT_PERIOD_LENGTH;

  const allGaps = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = daysBetween(sorted[i].startDate, sorted[i - 1].startDate);
    if (gap >= MIN_SANE_CYCLE_DAYS && gap <= MAX_SANE_CYCLE_DAYS) allGaps.push(gap);
  }
  const gaps = allGaps.slice(-MAX_CYCLES_FOR_AVERAGE);

  const periodLengths = sorted
    .filter((p) => p.endDate)
    .map((p) => daysBetween(p.endDate, p.startDate) + 1)
    .filter((n) => n > 0 && n <= 20)
    .slice(-MAX_CYCLES_FOR_AVERAGE);

  const hasRealCycleData = gaps.length >= MIN_COMPLETED_CYCLES_FOR_REAL_AVERAGE;
  const avgCycleLength = hasRealCycleData ? Math.round(mean(gaps)) : setupCycleLength;
  const avgPeriodLength = periodLengths.length ? Math.round(mean(periodLengths)) : setupPeriodLength;
  const variationDays = gaps.length >= 2 ? Math.max(...gaps) - Math.min(...gaps) : 0;
  const isIrregular = Boolean(settings.irregular) || variationDays > IRREGULAR_VARIATION_THRESHOLD_DAYS;

  return {
    sortedPeriods: sorted,
    avgCycleLength,
    avgPeriodLength,
    variationDays,
    isIrregular,
    cyclesObserved: gaps.length,
    hasRealCycleData,
  };
}

/**
 * Where `dateKey` sits in its cycle: 1-indexed cycle day, phase, and the
 * cycle's realized/estimated length. Anchors to the most recent period that
 * started on or before `dateKey`; uses the period after it (if logged) for
 * the realized cycle length, else falls back to `avgCycleLength` — so a
 * fully-bounded past cycle classifies precisely, and the current/open cycle
 * uses the rolling average.
 *
 * Returns null before any logged period (nothing to anchor to).
 */
export function getCycleDayAndPhase(dateKey, stats, todayKey = toLocalDateKey(new Date())) {
  const { sortedPeriods, avgCycleLength, avgPeriodLength } = stats;
  if (sortedPeriods.length === 0) return null;

  let anchorIdx = -1;
  for (let i = 0; i < sortedPeriods.length; i += 1) {
    if (sortedPeriods[i].startDate <= dateKey) anchorIdx = i;
    else break;
  }
  if (anchorIdx < 0) return null;

  const anchor = sortedPeriods[anchorIdx];
  const next = sortedPeriods[anchorIdx + 1] || null;
  const effectiveCycleLength = next ? daysBetween(next.startDate, anchor.startDate) : avgCycleLength;
  const effectivePeriodLength = anchor.endDate ? daysBetween(anchor.endDate, anchor.startDate) + 1 : avgPeriodLength;
  const cycleDay = daysBetween(dateKey, anchor.startDate) + 1;

  const periodEnd = anchor.endDate || (anchor === sortedPeriods[sortedPeriods.length - 1] ? todayKey : addDays(anchor.startDate, effectivePeriodLength - 1));
  if (dateKey <= periodEnd) {
    return { cycleDay, phase: 'menstrual', anchor, effectiveCycleLength, effectivePeriodLength };
  }

  const ovulationDay = effectiveCycleLength - OVULATION_DAYS_BEFORE_NEXT_PERIOD;
  let phase;
  if (cycleDay >= ovulationDay - OVULATORY_RADIUS_DAYS && cycleDay <= ovulationDay + OVULATORY_RADIUS_DAYS) {
    phase = 'ovulatory';
  } else if (cycleDay < ovulationDay - OVULATORY_RADIUS_DAYS) {
    phase = 'follicular';
  } else {
    phase = 'luteal';
  }
  return { cycleDay, phase, anchor, effectiveCycleLength, effectivePeriodLength };
}

/**
 * Next-period / ovulation / fertile-window / PMS-window predictions, plus
 * the two gentle nudges (late period, "did it end?"). All derived from the
 * latest logged period's start date projected forward by the rolling
 * average cycle length — see module docstring for the exact phase rule.
 */
export function computePredictions(periods, stats, todayKey = toLocalDateKey(new Date())) {
  const { sortedPeriods, avgCycleLength, avgPeriodLength, variationDays, isIrregular } = stats;
  if (sortedPeriods.length === 0) return null;

  const latest = sortedPeriods[sortedPeriods.length - 1];
  const nextPeriodStartKey = addDays(latest.startDate, avgCycleLength);
  const daysUntilNextPeriod = daysBetween(nextPeriodStartKey, todayKey);
  const ovulationDateKey = addDays(nextPeriodStartKey, -OVULATION_DAYS_BEFORE_NEXT_PERIOD);

  const halfSpread = Math.max(1, Math.round(variationDays / 2));
  const nextPeriodRange = isIrregular
    ? { startKey: addDays(nextPeriodStartKey, -halfSpread), endKey: addDays(nextPeriodStartKey, halfSpread) }
    : null;

  const currentPeriod = !latest.endDate && latest.startDate <= todayKey ? latest : null;
  const latePeriodPrompt = !currentPeriod && daysUntilNextPeriod <= -LATE_PERIOD_THRESHOLD_DAYS;
  const periodEndPrompt = Boolean(
    currentPeriod && daysBetween(todayKey, currentPeriod.startDate) + 1 >= PERIOD_END_PROMPT_AFTER_DAYS,
  );

  return {
    avgCycleLength,
    avgPeriodLength,
    variationDays,
    isIrregular,
    nextPeriodStartKey,
    nextPeriodRange,
    daysUntilNextPeriod,
    ovulationDateKey: isIrregular ? null : ovulationDateKey,
    fertileWindow: isIrregular
      ? null
      : { startKey: addDays(ovulationDateKey, -FERTILE_WINDOW_BEFORE_OVULATION_DAYS), endKey: addDays(ovulationDateKey, FERTILE_WINDOW_AFTER_OVULATION_DAYS) },
    pmsWindow: { startKey: addDays(nextPeriodStartKey, -PMS_WINDOW_DAYS), endKey: addDays(nextPeriodStartKey, -1) },
    currentPeriod,
    latePeriodPrompt,
    periodEndPrompt,
  };
}

/** Everything Today/Calendar/Patterns need, computed once. */
export function computeCycleState(periods, settings, todayKey = toLocalDateKey(new Date())) {
  const stats = computeCycleStats(periods, settings);
  if (stats.sortedPeriods.length === 0) {
    return { hasData: false, stats, todayKey };
  }
  const today = getCycleDayAndPhase(todayKey, stats, todayKey);
  const predictions = computePredictions(periods, stats, todayKey);
  return { hasData: true, stats, today, predictions, todayKey };
}

/** "in N days" / "today" / "N days ago", for prediction rows. */
export function formatRelativeDays(dateKey, todayKey = toLocalDateKey(new Date())) {
  const diff = daysBetween(dateKey, todayKey);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function isDateInRange(dateKey, startKey, endKey) {
  return dateKey >= startKey && dateKey <= endKey;
}

/**
 * The four phase spans (1-indexed, inclusive) across one cycle of
 * `cycleLength` days — for drawing the ring's arcs analytically instead of
 * classifying every individual day. Mirrors getCycleDayAndPhase's rule
 * exactly; short/unusual lengths are clamped so spans never invert.
 */
export function getPhaseSpans(cycleLength, periodLength) {
  const ovulationDay = cycleLength - OVULATION_DAYS_BEFORE_NEXT_PERIOD;
  const ovulatoryStart = Math.max(periodLength + 1, ovulationDay - OVULATORY_RADIUS_DAYS);
  const ovulatoryEnd = Math.min(cycleLength, ovulationDay + OVULATORY_RADIUS_DAYS);
  const spans = [{ phase: 'menstrual', startDay: 1, endDay: Math.min(periodLength, cycleLength) }];
  if (ovulatoryStart > periodLength + 1) {
    spans.push({ phase: 'follicular', startDay: periodLength + 1, endDay: ovulatoryStart - 1 });
  }
  if (ovulatoryStart <= ovulatoryEnd) {
    spans.push({ phase: 'ovulatory', startDay: ovulatoryStart, endDay: ovulatoryEnd });
  }
  if (ovulatoryEnd < cycleLength) {
    spans.push({ phase: 'luteal', startDay: ovulatoryEnd + 1, endDay: cycleLength });
  }
  return spans;
}
