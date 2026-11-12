import { mapPlanetStateRow } from '../../../supabaseClient';
import { PLANET_IDS, pickPlanetAssignments } from './galaxyPlanetAssignment';

/** Entry count -> size stage (PRD section 15: "Grows in 5 stages, capped so no planet dominates"). */
const SIZE_STAGE_THRESHOLDS = [3, 8, 16, 26, 41];

function sizeStageForCount(count) {
  let stage = 0;
  for (const threshold of SIZE_STAGE_THRESHOLDS) {
    if (count >= threshold) stage += 1;
  }
  return stage;
}

async function fetchPlanetState(supabase, userId) {
  const { data, error } = await supabase.from('planet_state').select('*').eq('user_id', userId);
  if (error) throw error;
  const byPlanet = {};
  for (const row of data || []) byPlanet[row.planet] = mapPlanetStateRow(row);
  return byPlanet;
}

/**
 * Recomputes all 8 planet_state rows for a user from the current
 * planet_assignments + journal_entries, and upserts them. Cheap enough to
 * run in full after every save/edit/delete at this app's scale.
 *
 * @returns {Promise<{newlyVisible: string[]}>} planets whose visibility just
 *   flipped false -> true (PRD section 16 "first appearance").
 */
export async function recomputeAllPlanetState(supabase, userId) {
  const [previousState, { data: rows, error }] = await Promise.all([
    fetchPlanetState(supabase, userId),
    supabase
      .from('planet_assignments')
      .select('planet, score, journal_entries(sentiment_score, created_at)')
      .eq('user_id', userId),
  ]);
  if (error) throw error;

  const byPlanet = Object.fromEntries(PLANET_IDS.map((p) => [p, []]));
  for (const row of rows || []) {
    if (byPlanet[row.planet]) byPlanet[row.planet].push(row);
  }

  const now = new Date().toISOString();
  const upserts = PLANET_IDS.map((planet) => {
    const entries = byPlanet[planet]
      .slice()
      .sort((a, b) => new Date(b.journal_entries?.created_at || 0) - new Date(a.journal_entries?.created_at || 0));
    const entryCount = entries.length;
    const last10 = entries.slice(0, 10).map((e) => e.journal_entries?.sentiment_score).filter((v) => v != null);
    const avgMood = last10.length ? last10.reduce((sum, v) => sum + Number(v), 0) / last10.length : null;
    const lastEntryAt = entries[0]?.journal_entries?.created_at ?? null;
    const wasVisible = previousState[planet]?.visible ?? false;
    return {
      user_id: userId,
      planet,
      entry_count: entryCount,
      size_stage: sizeStageForCount(entryCount),
      avg_mood: avgMood,
      last_entry_at: lastEntryAt,
      // Visibility never flips back off once reached (PRD: planets never disappear).
      visible: wasVisible || entryCount >= 3,
      updated_at: now,
    };
  });

  const { error: upsertError } = await supabase.from('planet_state').upsert(upserts, { onConflict: 'user_id,planet' });
  if (upsertError) throw upsertError;

  const newlyVisible = upserts.filter((row) => row.visible && !(previousState[row.planet]?.visible ?? false)).map((row) => row.planet);
  return { newlyVisible };
}

/**
 * Scores and persists an entry's planet assignment(s), then recomputes state.
 * Call after analysis resolves, on both create and edit.
 *
 * @returns {Promise<{primary: string|null, secondary: string|null, newlyVisible: string[]}>}
 */
export async function assignPlanetsForEntry(supabase, userId, entryId, planetScores, sentimentScore) {
  let { primary, secondary, needsRecencyTiebreak } = pickPlanetAssignments(planetScores, { sentimentScore });

  if (needsRecencyTiebreak.length > 1) {
    const { data } = await supabase
      .from('planet_state')
      .select('planet, last_entry_at')
      .eq('user_id', userId)
      .in('planet', needsRecencyTiebreak);
    // Least recently written about wins (PRD section 17); never-written-about beats any date.
    const byRecency = (needsRecencyTiebreak || []).slice().sort((a, b) => {
      const aAt = data?.find((r) => r.planet === a)?.last_entry_at;
      const bAt = data?.find((r) => r.planet === b)?.last_entry_at;
      if (!aAt && !bAt) return 0;
      if (!aAt) return -1;
      if (!bAt) return 1;
      return new Date(aAt) - new Date(bAt);
    });
    primary = byRecency[0];
    secondary = secondary === primary ? byRecency[1] ?? null : secondary;
  }

  const { error: deleteError } = await supabase.from('planet_assignments').delete().eq('entry_id', entryId);
  if (deleteError) throw deleteError;

  const toInsert = [];
  if (primary) {
    toInsert.push({
      user_id: userId,
      entry_id: entryId,
      planet: primary,
      score: planetScores[primary],
      is_primary: true,
      source: 'ai',
    });
  }
  if (secondary) {
    toInsert.push({
      user_id: userId,
      entry_id: entryId,
      planet: secondary,
      score: planetScores[secondary],
      is_primary: false,
      source: 'ai',
    });
  }
  if (toInsert.length) {
    const { error: insertError } = await supabase.from('planet_assignments').insert(toInsert);
    if (insertError) throw insertError;
  }

  const { newlyVisible } = await recomputeAllPlanetState(supabase, userId);
  return { primary, secondary, newlyVisible };
}

/**
 * User-initiated move or removal of one entry's planet assignment (PRD
 * section 17 "Wrong assignment"). `toPlanet: null` removes it entirely.
 */
export async function correctPlanetAssignment(supabase, userId, entryId, fromPlanet, toPlanet) {
  const { error: deleteError } = await supabase
    .from('planet_assignments')
    .delete()
    .eq('entry_id', entryId)
    .eq('planet', fromPlanet);
  if (deleteError) throw deleteError;

  if (toPlanet) {
    const { data: remaining } = await supabase
      .from('planet_assignments')
      .select('is_primary')
      .eq('entry_id', entryId);
    const hasPrimary = (remaining || []).some((r) => r.is_primary);
    const { error: insertError } = await supabase.from('planet_assignments').insert({
      user_id: userId,
      entry_id: entryId,
      planet: toPlanet,
      score: 1,
      is_primary: !hasPrimary,
      source: 'user',
    });
    if (insertError) throw insertError;
  } else {
    // Removed outright — promote whichever assignment remains, if any, to primary.
    const { data: remaining } = await supabase
      .from('planet_assignments')
      .select('id, is_primary')
      .eq('entry_id', entryId);
    if (remaining?.length && !remaining.some((r) => r.is_primary)) {
      await supabase.from('planet_assignments').update({ is_primary: true }).eq('id', remaining[0].id);
    }
  }

  await supabase.from('planet_corrections').insert({
    user_id: userId,
    entry_id: entryId,
    from_planet: fromPlanet,
    to_planet: toPlanet,
  });

  return recomputeAllPlanetState(supabase, userId);
}
