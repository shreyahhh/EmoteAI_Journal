/**
 * Fuzzy-match free-form Gemini theme/emotion strings against a fixed
 * dictionary. Exact-key lookups miss almost everything Gemini writes
 * (e.g. "Work-related stress" vs a "stress" key), so this checks
 * substring overlap in both directions instead.
 *
 * @param {string[]} tags - raw theme/emotion strings from entries
 * @param {Record<string, string>} dictionary - lowercase keyword -> mapped value
 * @returns {string[]} matched values, de-duplicated, most frequent first
 */
export function matchTagsFuzzy(tags, dictionary) {
  const counts = new Map();
  const keys = Object.keys(dictionary);

  tags.forEach((tag) => {
    const normalized = String(tag || '').toLowerCase().trim();
    if (!normalized) return;
    const hit = keys.find((key) => normalized.includes(key) || key.includes(normalized));
    if (hit) {
      const value = dictionary[hit];
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value);
}
