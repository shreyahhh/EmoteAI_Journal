import { toLocalDateKey } from './entryDates';

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const MAX_CYCLES_FOR_AVERAGE = 6;

function dateKeyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(aKey, bKey) {
  return Math.round((dateKeyToDate(bKey) - dateKeyToDate(aKey)) / 86400000);
}

/**
 * Average cycle/period length from logged periods, and the next expected
 * period's start/end window. Used both by the Cycle page's "looking ahead"
 * card and by the reminder scheduler (day 1 of that window -> "did your
 * period start?", the other days -> "how are you?").
 */
export function estimateNextPeriod(cyclePeriods) {
  if (!cyclePeriods?.length) return null;
  const sorted = [...cyclePeriods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const recent = sorted.slice(-MAX_CYCLES_FOR_AVERAGE);

  const gaps = [];
  for (let i = 1; i < recent.length; i += 1) {
    gaps.push(daysBetween(recent[i - 1].startDate, recent[i].startDate));
  }
  const avgCycleLength = gaps.length
    ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
    : DEFAULT_CYCLE_LENGTH;

  const periodLengths = recent
    .filter((p) => p.endDate)
    .map((p) => daysBetween(p.startDate, p.endDate) + 1);
  const avgPeriodLength = periodLengths.length
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : DEFAULT_PERIOD_LENGTH;

  const lastStart = recent[recent.length - 1].startDate;
  const nextStartKey = toLocalDateKey(addDays(dateKeyToDate(lastStart), avgCycleLength));
  const nextEndKey = toLocalDateKey(addDays(dateKeyToDate(nextStartKey), avgPeriodLength - 1));

  return {
    avgCycleLength,
    avgPeriodLength,
    nextStartKey,
    nextEndKey,
  };
}

/**
 * Where `todayKey` falls relative to the expected next period, for reminder
 * copy: 'start' on the first expected day, 'within' on the rest of the
 * expected window, otherwise null (no cycle nudge today).
 */
export function cycleCheckinPrompt(cyclePeriods, todayKey = toLocalDateKey(new Date())) {
  const forecast = estimateNextPeriod(cyclePeriods);
  if (!forecast) return null;
  if (todayKey === forecast.nextStartKey) return 'start';
  if (todayKey > forecast.nextStartKey && todayKey <= forecast.nextEndKey) return 'within';
  return null;
}
