/**
 * Cycle-length/period-length estimation from logged periods.
 *
 * This used to also hold phase classification and journal-pattern analysis
 * for the (now superseded) Cycle v1 UI — that logic moved to
 * ./cycleCalculations.js for the Cycle v2 redesign, which uses an exact
 * "ovulation = next period − 14 days" rule rather than this module's older
 * luteal-length-clamp heuristic. `estimateCycleStats` itself stays here
 * unchanged: it's still the feature-engineering input to the mood-forecast
 * model in ./cycleModel.js, which is independent of either UI.
 */
const DAY_MS = 86400000;

const DEFAULTS = {
  cycleLengthDays: 28,
  periodLengthDays: 5,
  lutealLengthDays: 14,
};

const MIN_SANE_CYCLE_DAYS = 15;
const MAX_SANE_CYCLE_DAYS = 60;
const MIN_CYCLES_FOR_ESTIMATE = 2; // completed start-to-start gaps

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
