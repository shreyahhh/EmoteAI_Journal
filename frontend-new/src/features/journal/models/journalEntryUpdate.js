/**
 * Update a journal_entries row. If the update carries `analysis` and the column
 * doesn't exist yet (the sarcasm_check migration hasn't been applied), retry
 * without it, so saving and analysing an entry never breaks because of the
 * order the migration and the app are rolled out in.
 *
 * @returns {Promise<{error: Object|null}>}
 */
export async function updateEntryRow(supabase, entryId, update) {
  const first = await supabase.from('journal_entries').update(update).eq('id', entryId);
  if (!first.error || !('analysis' in update)) return first;

  const msg = `${first.error.message || ''} ${first.error.details || ''}`;
  const missingColumn = ['PGRST204', '42703'].includes(first.error.code) || /analysis/i.test(msg);
  if (!missingColumn) return first;

  console.warn('journal_entries.analysis is missing; run the sarcasm_check migration. Saving without it.');
  const { analysis, ...rest } = update; // eslint-disable-line no-unused-vars
  return supabase.from('journal_entries').update(rest).eq('id', entryId);
}
