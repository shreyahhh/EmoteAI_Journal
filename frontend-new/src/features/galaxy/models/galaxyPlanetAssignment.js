/**
 * Pure assignment logic for Stars and Planets PRD v2, Part B section 13:
 * an entry joins a planet only above a score threshold AND when the moment
 * is "meaningful" (either strong emotion, or a score so high it reads as a
 * clear life event even on a calm day); at most two planets, the higher
 * score primary.
 */

export const PLANET_IDS = ['venus', 'earth', 'mercury', 'saturn', 'jupiter', 'mars', 'neptune', 'uranus'];

const SCORE_THRESHOLD = 0.7;
const CLEAR_EVENT_SCORE = 0.85;
const MEANINGFUL_INTENSITY = 0.5;

/** Gemini's -10..10 sentiment scale collapsed to a 0..1 "how strong was this" intensity. */
export function entryIntensity(sentimentScore) {
  if (!Number.isFinite(sentimentScore)) return 0;
  return Math.min(1, Math.abs(sentimentScore) / 10);
}

/**
 * @param {Record<string, number>|null} planetScores one 0..1 score per planet id, or null if scoring failed
 * @param {{sentimentScore?: number}} opts
 * @returns {{primary: string|null, secondary: string|null, needsRecencyTiebreak: string[]}}
 *   needsRecencyTiebreak lists planets tied for primary when the score alone can't decide — the
 *   caller breaks the tie using planet_state.last_entry_at (the one written about least recently wins,
 *   per PRD section 17), since this pure function has no access to that history.
 */
export function pickPlanetAssignments(planetScores, { sentimentScore } = {}) {
  if (!planetScores) return { primary: null, secondary: null, needsRecencyTiebreak: [] };

  const intensity = entryIntensity(sentimentScore);
  const meaningful = (score) => intensity >= MEANINGFUL_INTENSITY || score >= CLEAR_EVENT_SCORE;

  const candidates = PLANET_IDS
    .map((planet) => [planet, planetScores[planet]])
    .filter(([, score]) => Number.isFinite(score) && score >= SCORE_THRESHOLD && meaningful(score))
    .sort((a, b) => b[1] - a[1]);

  if (candidates.length === 0) return { primary: null, secondary: null, needsRecencyTiebreak: [] };

  const topScore = candidates[0][1];
  const tiedForPrimary = candidates.filter(([, score]) => score === topScore).map(([planet]) => planet);
  const primary = tiedForPrimary[0];
  const secondary = candidates.find(([planet]) => planet !== primary)?.[0] ?? null;

  return { primary, secondary, needsRecencyTiebreak: tiedForPrimary.length > 1 ? tiedForPrimary : [] };
}
