/**
 * Longitudinal pattern detection over a user's journal entries.
 *
 * This is deliberately NOT another AI call: Gemini already reads each entry
 * in isolation (mood/emotions/themes — see lib/gemini.js). What was missing
 * is something that looks *across* entries — trend direction, recurring
 * triggers, day-of-week effects — which is a time-series/statistics problem,
 * not a language one. Doing it with plain arithmetic over the data already
 * stored (sentiment_score, mood, themes, activities, created_at) is faster,
 * free, deterministic, and testable — an LLM asked to "notice patterns" in a
 * wall of text can't guarantee any of that.
 *
 * Every detector below enforces a minimum sample size before it will report
 * anything, and returns null rather than guess from thin data.
 */
import { getCreatedAtDate, toLocalDateKey } from './entryDates';
import { moodValence } from './moodBuckets';
import { ACTIVITY_LABELS } from './moodMeta';

const DAY_MS = 86400000;
const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function round1(n) {
  return n == null ? null : Math.round(n * 10) / 10;
}

/** Entries newest-first, each annotated with its parsed date and mood valence. Invalid dates dropped. */
function toDatedPoints(entries) {
  return (entries || [])
    .map((entry) => {
      const date = getCreatedAtDate(entry);
      if (!date || Number.isNaN(date.getTime())) return null;
      return { entry, date, valence: moodValence(entry) };
    })
    .filter(Boolean)
    .sort((a, b) => b.date - a.date);
}

/**
 * Recent-vs-prior window comparison. Windows are entry-count based (not
 * calendar-day based) so it still works for people who don't write daily.
 */
function detectTrend(points, { windowSize = 8, minWindowSize = 4, threshold = 1.5 } = {}) {
  const size = Math.min(windowSize, Math.floor(points.length / 2));
  if (size < minWindowSize) return null;

  const recent = points.slice(0, size).map((p) => p.valence);
  const prior = points.slice(size, size * 2).map((p) => p.valence);
  const recentAvg = mean(recent);
  const priorAvg = mean(prior);
  if (recentAvg == null || priorAvg == null) return null;

  const delta = recentAvg - priorAvg;
  if (Math.abs(delta) < threshold) return null;

  const direction = delta > 0 ? 'improving' : 'dipping';
  return {
    id: 'trend',
    type: 'trend',
    severity: direction === 'improving' ? 'positive' : 'notice',
    title: direction === 'improving' ? 'Your tone has been lifting' : 'Your tone has dipped lately',
    description:
      direction === 'improving'
        ? `Your last ${size} entries average ${round1(recentAvg)} vs ${round1(priorAvg)} for the ${size} before that — a gentle upswing.`
        : `Your last ${size} entries average ${round1(recentAvg)} vs ${round1(priorAvg)} for the ${size} before that — worth noticing.`,
    sampleSize: size * 2,
    metric: { recentAvg: round1(recentAvg), priorAvg: round1(priorAvg), delta: round1(delta) },
  };
}

/** Which weekday runs consistently lower/higher than the person's own average. */
function detectWeekdayEffect(points, { minPerWeekday = 3, threshold = 2 } = {}) {
  const byWeekday = Array.from({ length: 7 }, () => []);
  points.forEach((p) => byWeekday[p.date.getDay()].push(p.valence));

  const overall = mean(points.map((p) => p.valence));
  if (overall == null) return null;

  let best = null;
  byWeekday.forEach((values, weekday) => {
    if (values.length < minPerWeekday) return;
    const avg = mean(values);
    const delta = avg - overall;
    if (Math.abs(delta) < threshold) return;
    if (!best || Math.abs(delta) > Math.abs(best.delta)) {
      best = { weekday, avg, delta, sampleSize: values.length };
    }
  });
  if (!best) return null;

  const isLow = best.delta < 0;
  const label = WEEKDAY_LABELS[best.weekday];
  return {
    id: 'weekday',
    type: 'weekday',
    severity: isLow ? 'notice' : 'positive',
    title: isLow ? `${label}s tend to run lower for you` : `${label}s tend to run brighter for you`,
    description: `${label} entries average ${round1(best.avg)} vs your overall ${round1(overall)}, across ${best.sampleSize} entries.`,
    sampleSize: best.sampleSize,
    metric: { weekday: label, avg: round1(best.avg), overall: round1(overall), delta: round1(best.delta) },
  };
}

/** Tags (theme/emotion/activity) whose entries run notably lower or higher than entries without that tag. */
function detectTagCorrelations(entries, { field, kind, labelFor = (tag) => tag, minTagCount = 4, threshold = 2.5, maxResults = 3 } = {}) {
  const byTag = new Map();
  entries.forEach((entry) => {
    const tags = entry[field];
    if (!Array.isArray(tags)) return;
    const v = moodValence(entry);
    new Set(tags).forEach((tag) => {
      if (!byTag.has(tag)) byTag.set(tag, { withTag: [], withoutTag: [] });
      byTag.get(tag).withTag.push(v);
    });
  });
  if (byTag.size === 0) return [];

  entries.forEach((entry) => {
    const tags = new Set(Array.isArray(entry[field]) ? entry[field] : []);
    const v = moodValence(entry);
    byTag.forEach((bucket, tag) => {
      if (!tags.has(tag)) bucket.withoutTag.push(v);
    });
  });

  const results = [];
  byTag.forEach((bucket, tag) => {
    if (bucket.withTag.length < minTagCount || bucket.withoutTag.length < minTagCount) return;
    const withAvg = mean(bucket.withTag);
    const withoutAvg = mean(bucket.withoutTag);
    const delta = withAvg - withoutAvg;
    if (Math.abs(delta) < threshold) return;
    const label = labelFor(tag);
    results.push({
      id: `${kind}-${tag}`,
      type: kind,
      severity: delta < 0 ? 'notice' : 'positive',
      title: delta < 0 ? `"${label}" entries tend to run heavier` : `"${label}" entries tend to run brighter`,
      description: `Entries tagged "${label}" average ${round1(withAvg)} vs ${round1(withoutAvg)} for entries without it, across ${bucket.withTag.length} tagged entries.`,
      sampleSize: bucket.withTag.length,
      metric: { tag: label, withAvg: round1(withAvg), withoutAvg: round1(withoutAvg), delta: round1(delta) },
    });
  });

  return results.sort((a, b) => Math.abs(b.metric.delta) - Math.abs(a.metric.delta)).slice(0, maxResults);
}

/** Current run of consecutive calendar days (ending today or yesterday) with a below-threshold mood. */
function detectLowMoodStreak(points, { valenceThreshold = -2, minStreak = 3 } = {}) {
  if (points.length === 0) return null;

  const byDay = new Map();
  points.forEach((p) => {
    const key = toLocalDateKey(p.date);
    const existing = byDay.get(key);
    if (existing == null || p.valence < existing) byDay.set(key, p.valence);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toLocalDateKey(today);
  const yesterdayKey = toLocalDateKey(new Date(today.getTime() - DAY_MS));
  let cursor = byDay.has(todayKey) ? today : byDay.has(yesterdayKey) ? new Date(today.getTime() - DAY_MS) : null;
  if (!cursor) return null;

  let streak = 0;
  let sum = 0;
  while (true) {
    const key = toLocalDateKey(cursor);
    const v = byDay.get(key);
    if (v == null || v > valenceThreshold) break;
    streak += 1;
    sum += v;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  if (streak < minStreak) return null;

  return {
    id: 'low-mood-streak',
    type: 'streak',
    severity: 'notice',
    title: `${streak} days in a row running low`,
    description: `Your last ${streak} journaled days average ${round1(sum / streak)}. If this keeps up, consider a gentle check-in — maybe with the Resources tab.`,
    sampleSize: streak,
    metric: { streak, avg: round1(sum / streak) },
  };
}

/**
 * Runs every detector and returns the flagged patterns, most notable first.
 * Never throws on sparse data — detectors simply omit themselves.
 */
export function detectPatterns(entries) {
  const points = toDatedPoints(entries);
  const patterns = [
    detectTrend(points),
    detectWeekdayEffect(points),
    detectLowMoodStreak(points),
    ...detectTagCorrelations(entries, { field: 'themes', kind: 'theme' }),
    ...detectTagCorrelations(entries, {
      field: 'activities',
      kind: 'activity',
      labelFor: (key) => ACTIVITY_LABELS[key] || key,
    }),
  ].filter(Boolean);

  const severityRank = { notice: 0, positive: 1, info: 2 };
  return patterns.sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9));
}
