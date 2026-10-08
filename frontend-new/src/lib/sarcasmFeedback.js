import { analyzeWithModel } from './emotionApi';
import { sarcasticKeys, toStoredAnalysis } from './entryAnalysis';
import { updateEntryRow } from './entryUpdate';
import { normLine } from './sarcasmKeys';

/** Lines the model flagged as sarcastic-but-positive that the person hasn't answered yet. */
export function pendingSarcasmLines(entry) {
  const analysis = entry?.analysis;
  if (!analysis?.lines?.length) return [];
  const answers = analysis.answers || {};
  return analysis.lines.filter((l) => l.sarcasm?.needsReview && !answers[normLine(l.text)]);
}

/**
 * Record the person's answer to "did you mean that sarcastically?".
 *
 *  - 'sarcastic': re-runs the model with this line (and earlier confirmed ones)
 *    treated as sarcastic, so the line's emotions and the entry's mood and score
 *    update. Themes are left alone.
 *  - 'sincere' / 'skipped': nothing about the reading changes; the answer is
 *    just remembered so the question isn't asked again.
 *
 * 'sarcastic' and 'sincere' are also saved to sarcasm_feedback (the person's own
 * account). `shareForTraining` is the person's explicit opt-in for using the
 * label to retrain the detector; it is false unless they ticked it.
 *
 * The latest stored answers and analysis are re-read first. The `entry` prop can
 * be stale (realtime hasn't delivered the previous answer yet, or another tab
 * answered), and building the new answers from it would overwrite them.
 *
 * Throws if the entry can't be updated, so the UI can show an error.
 */
export async function answerSarcasm({ supabase, entry, line, answer, shareForTraining = false }) {
  const key = normLine(line.text);

  // Best effort: if the read fails (e.g. the analysis column doesn't exist yet), use the prop.
  const { data: fresh } = await supabase
    .from('journal_entries')
    .select('content, analysis')
    .eq('id', entry.id)
    .maybeSingle();
  const content = fresh?.content ?? entry.content;
  const analysis = fresh?.analysis ?? entry.analysis;

  const answers = { ...(analysis?.answers || {}), [key]: answer };

  let update;
  if (answer === 'sarcastic') {
    const result = await analyzeWithModel(content, { confirmedTexts: sarcasticKeys(answers) });
    update = {
      sentiment_score: result.sentimentScore,
      emotions: result.emotions,
      mood: result.mood,
      analysis: toStoredAnalysis(result, answers),
    };
  } else {
    update = { analysis: { ...analysis, answers } };
  }

  const { error } = await updateEntryRow(supabase, entry.id, update);
  if (error) throw error;

  if (answer === 'sarcastic' || answer === 'sincere') {
    const { error: fbError } = await supabase.from('sarcasm_feedback').upsert(
      {
        user_id: entry.userId,
        entry_id: entry.id,
        line_key: key,
        line_text: line.text,
        model_probability: line.sarcasm?.probability ?? null,
        user_label: answer,
        share_for_training: Boolean(shareForTraining),
      },
      { onConflict: 'user_id,entry_id,line_key' },
    );
    // The answer already took effect; a feedback-log failure shouldn't undo it.
    if (fbError) console.error('Could not save sarcasm feedback:', fbError);
  }
}
