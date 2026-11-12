import { daysBetween, addDays } from './cycleCalculations';

const SYMPTOM_LABELS = {
  cramps: 'Cramps', bloating: 'Bloating', tender_breasts: 'Tender breasts',
  headache: 'Headache', back_pain: 'Back pain', acne: 'Acne',
};
const MOOD_LABELS = { calm: 'Calm', sensitive: 'Sensitive', irritable: 'Irritable', anxious: 'Anxious', low: 'Low', energetic: 'Energetic' };

/** One bar per completed cycle (start -> next start), most recent last, capped to `maxCount`. */
export function buildCycleHistory(periods, maxCount) {
  const sorted = [...periods].filter((p) => p.startDate).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const cycles = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const totalLength = daysBetween(sorted[i].startDate, prev.startDate);
    if (totalLength < 10 || totalLength > 90) continue;
    const periodLength = prev.endDate ? daysBetween(prev.endDate, prev.startDate) + 1 : null;
    cycles.push({
      monthLabel: new Date(`${prev.startDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short' }),
      totalLength,
      periodLength,
    });
  }
  return cycles.slice(-maxCount);
}

function topN(counter, n) {
  return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([id]) => SYMPTOM_LABELS[id] || MOOD_LABELS[id] || id);
}

/** Most-logged body symptoms on period days, and in the 7 days before each period, over the given periods. */
export function buildMostLogged(periods, dailyLogs, maxCount) {
  const recentPeriods = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(-maxCount);
  const byDate = new Map(dailyLogs.map((l) => [l.logDate, l]));

  const onPeriod = new Map();
  const beforePeriod = new Map();

  recentPeriods.forEach((p) => {
    const end = p.endDate || p.startDate;
    for (let d = p.startDate; d <= end; d = addDays(d, 1)) {
      const log = byDate.get(d);
      (log?.symptoms || []).forEach((id) => onPeriod.set(id, (onPeriod.get(id) || 0) + 1));
    }
    for (let i = 1; i <= 7; i += 1) {
      const d = addDays(p.startDate, -i);
      const log = byDate.get(d);
      (log?.symptoms || []).forEach((id) => beforePeriod.set(id, (beforePeriod.get(id) || 0) + 1));
      (log?.mood || []).forEach((id) => beforePeriod.set(id, (beforePeriod.get(id) || 0) + 1));
    }
  });

  return {
    onPeriodDays: topN(onPeriod, 3),
    weekBefore: topN(beforePeriod, 3),
  };
}
