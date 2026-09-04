import { supabase, mapPatternFeedbackRow } from '../supabaseClient';

/** All of this user's standing pattern votes, keyed by pattern_id for O(1) lookup in the UI. */
export async function fetchPatternFeedback(userId) {
  if (!supabase || !userId) return {};
  const { data, error } = await supabase.from('pattern_feedback').select('*').eq('user_id', userId);
  if (error) {
    if (!`${error.message}`.includes('pattern_feedback')) console.error('Pattern feedback load:', error);
    return {};
  }
  const byPatternId = {};
  (data || []).forEach((row) => {
    const mapped = mapPatternFeedbackRow(row);
    byPatternId[mapped.patternId] = mapped;
  });
  return byPatternId;
}

/**
 * Records (or updates) this user's verdict on one detected pattern.
 * Voting the same way twice in a row retracts the vote — see PatternInsights.
 */
export async function submitPatternFeedback(userId, pattern, verdict) {
  if (!supabase || !userId || !pattern) return { error: new Error('Missing user or pattern.') };
  const { error } = await supabase.from('pattern_feedback').upsert(
    {
      user_id: userId,
      pattern_id: pattern.id,
      pattern_type: pattern.type,
      verdict,
      snapshot: { title: pattern.title, description: pattern.description, metric: pattern.metric ?? null },
    },
    { onConflict: 'user_id,pattern_id' },
  );
  if (error) console.error('Pattern feedback submit:', error);
  return { error };
}

export async function retractPatternFeedback(userId, patternId) {
  if (!supabase || !userId || !patternId) return { error: new Error('Missing user or pattern id.') };
  const { error } = await supabase.from('pattern_feedback').delete().eq('user_id', userId).eq('pattern_id', patternId);
  if (error) console.error('Pattern feedback retract:', error);
  return { error };
}
