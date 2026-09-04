import { getCreatedAtDate } from './entryDates';

const MOOD_KEYS = ['happy', 'sad', 'angry', 'anxious', 'neutral'];

/** Numeric mood when sentiment_score is missing (rough valence for charts). */
export function moodValence(entry) {
  if (entry?.sentimentScore != null && !Number.isNaN(Number(entry.sentimentScore))) {
    return Number(entry.sentimentScore);
  }
  const map = { happy: 5, neutral: 0, sad: -4, anxious: -3, angry: -5 };
  return map[entry?.mood] ?? 0;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKey(d) {
  return startOfDay(d).toISOString().slice(0, 10);
}

/**
 * @param {Array} entries
 * @param {'week'|'month'|'year'} range
 * @returns {{ label: string, key: string, happy: number, sad: number, angry: number, anxious: number, neutral: number, avgSentiment: number|null, entryCount: number }[]}
 */
export function buildMoodBuckets(entries, range) {
  const now = new Date();
  const buckets = [];

  if (range === 'week') {
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const s = startOfDay(day);
      const e = new Date(s);
      e.setDate(e.getDate() + 1);
      buckets.push({
        key: dateKey(s),
        label: s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        start: s,
        end: e,
        happy: 0,
        sad: 0,
        angry: 0,
        anxious: 0,
        neutral: 0,
        sentimentSum: 0,
        sentimentN: 0,
      });
    }
  } else if (range === 'month') {
    for (let w = 4; w >= 0; w -= 1) {
      const anchor = new Date(now);
      anchor.setDate(anchor.getDate() - w * 7);
      const start = startOfDay(anchor);
      start.setDate(start.getDate() - 6);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const lastDay = new Date(end);
      lastDay.setDate(lastDay.getDate() - 1);
      const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      buckets.push({
        key: `w${w}`,
        label,
        start,
        end,
        happy: 0,
        sad: 0,
        angry: 0,
        anxious: 0,
        neutral: 0,
        sentimentSum: 0,
        sentimentN: 0,
      });
    }
  } else {
    for (let m = 11; m >= 0; m -= 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthEndExclusive = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);
      buckets.push({
        key: dateKey(monthStart),
        label: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        start: startOfDay(monthStart),
        end: monthEndExclusive,
        happy: 0,
        sad: 0,
        angry: 0,
        anxious: 0,
        neutral: 0,
        sentimentSum: 0,
        sentimentN: 0,
      });
    }
  }

  const inBucket = (d, b) => d >= b.start && d < b.end;

  entries.forEach((entry) => {
    const d = getCreatedAtDate(entry);
    if (!d || Number.isNaN(d.getTime())) return;
    const bucket = buckets.find((b) => inBucket(d, b));
    if (!bucket) return;
    const mood = (entry.mood || 'neutral').toLowerCase();
    if (MOOD_KEYS.includes(mood)) bucket[mood]++;
    else bucket.neutral++;
    const v = moodValence(entry);
    bucket.sentimentSum += v;
    bucket.sentimentN += 1;
  });

  return buckets.map((b) => ({
    label: b.label,
    key: b.key,
    happy: b.happy,
    sad: b.sad,
    angry: b.angry,
    anxious: b.anxious,
    neutral: b.neutral,
    avgSentiment: b.sentimentN > 0 ? Math.round((b.sentimentSum / b.sentimentN) * 10) / 10 : null,
    entryCount: b.sentimentN,
  }));
}

export function filterEntriesByRange(entries, range) {
  const now = new Date();
  let start;
  if (range === 'week') {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else if (range === 'month') {
    start = new Date(now);
    start.setDate(start.getDate() - 35);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  }
  start.setHours(0, 0, 0, 0);
  return entries.filter((e) => {
    const d = getCreatedAtDate(e);
    return d && d >= start;
  });
}
