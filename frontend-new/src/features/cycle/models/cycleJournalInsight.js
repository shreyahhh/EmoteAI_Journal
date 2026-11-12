import { getCreatedAtDate, toLocalDateKey } from '../../../lib/models/entryDates';
import { moodValence } from '../../../lib/models/moodBuckets';
import { getCycleDayAndPhase, getPhaseMeta } from './cycleCalculations';

const MIN_CYCLES = 2;
const MIN_ENTRIES = 8;
const MIN_PHASE_ENTRIES = 3;

/**
 * "From your journal" insight for the current phase — never surfaces the
 * entry text itself (that stays inside the journal / day-detail views),
 * only an aggregate tone word plus how many entries it's based on. Hidden
 * entirely below the data threshold rather than inventing a pattern.
 */
export function buildPhaseJournalInsight(entries, stats, currentPhase) {
  if (!currentPhase || stats.sortedPeriods.length === 0) return null;
  if (stats.cyclesObserved < MIN_CYCLES) return null;

  const byPhase = new Map();
  let placed = 0;
  (entries || []).forEach((entry) => {
    const date = getCreatedAtDate(entry);
    if (!date || Number.isNaN(date.getTime())) return;
    const dateKey = toLocalDateKey(date);
    const position = getCycleDayAndPhase(dateKey, stats, dateKey);
    if (!position) return;
    placed += 1;
    const list = byPhase.get(position.phase) || [];
    list.push(moodValence(entry));
    byPhase.set(position.phase, list);
  });

  if (placed < MIN_ENTRIES) return null;

  const valences = byPhase.get(currentPhase) || [];
  if (valences.length < MIN_PHASE_ENTRIES) return null;

  const avg = valences.reduce((a, b) => a + b, 0) / valences.length;
  const tone = avg > 1.5 ? 'lighter' : avg < -1.5 ? 'heavier' : 'mixed';
  const label = getPhaseMeta(currentPhase)?.label || 'this phase';

  return {
    text: `Your entries during ${label.toLowerCase()} tend to run ${tone} in tone — based on ${valences.length} entries.`,
    count: valences.length,
  };
}
