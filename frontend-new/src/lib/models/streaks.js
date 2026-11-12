import { getCreatedAtDate } from './entryDates';

function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Journaling streak from entry dates (calendar days with at least one entry).
 * `current` stays alive through the day after the last entry (streak isn't
 * broken until a full day is skipped), matching how most habit trackers count.
 */
export function computeStreak(entries) {
  const dateKeys = new Set();
  (entries || []).forEach((entry) => {
    const d = getCreatedAtDate(entry);
    if (d && !Number.isNaN(d.getTime())) dateKeys.add(localDateKey(d));
  });

  if (dateKeys.size === 0) {
    return { current: 0, longest: 0, activeToday: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeToday = dateKeys.has(localDateKey(today));

  let current = 0;
  let cursor = activeToday ? today : addDays(today, -1);
  if (dateKeys.has(localDateKey(cursor))) {
    while (dateKeys.has(localDateKey(cursor))) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  const sortedKeys = [...dateKeys].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedKeys.length; i += 1) {
    const prev = new Date(sortedKeys[i - 1]);
    const next = new Date(sortedKeys[i]);
    const dayDiff = Math.round((next - prev) / 86400000);
    run = dayDiff === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  return { current, longest, activeToday };
}
