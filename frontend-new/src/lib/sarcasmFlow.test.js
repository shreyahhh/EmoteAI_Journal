/**
 * Tests for the "did you mean that sarcastically?" flow: analysis orchestration
 * (model vs Gemini fallback), answering, and the update helper.
 */
import { normLine } from './sarcasmKeys';

jest.mock('./emotionApi', () => ({
  emotionApiConfigured: true,
  analyzeWithModel: jest.fn(),
}));
jest.mock('./gemini', () => ({
  analyzeEntryWithGemini: jest.fn(),
  getThemes: jest.fn(),
}));

const { analyzeWithModel } = require('./emotionApi');
const { analyzeEntryWithGemini, getThemes } = require('./gemini');
const { analyzeEntry, toStoredAnalysis } = require('./entryAnalysis');
const { answerSarcasm, pendingSarcasmLines } = require('./sarcasmFeedback');
const { updateEntryRow } = require('./entryUpdate');

const LINE_A = 'Great, another all-hands at 8am on a Monday!';
const LINE_B = 'I finally got the promotion I worked so hard for!';

const modelResult = (extra = {}) => ({
  sentimentScore: 2.7,
  mood: 'happy',
  emotions: ['Joy'],
  mixed: false,
  truncated: false,
  totalLines: 2,
  sarcasm: { needsReview: [0, 1] },
  scores: { joy: 0.9 },
  lines: [
    { text: LINE_A, start: 0, end: 44, mood: 'happy', sentimentScore: 9.3, emotions: ['Admiration'], adjusted: false,
      sarcasm: { probability: 0.99, flagged: true, confirmed: false, needsReview: true },
      ifSarcastic: { mood: 'angry', sentimentScore: -9.4, emotions: ['Annoyance'] }, explanation: { words: [] } },
    { text: LINE_B, start: 45, end: 95, mood: 'happy', sentimentScore: 7.3, emotions: ['Joy'], adjusted: false,
      sarcasm: { probability: 0.97, flagged: true, confirmed: false, needsReview: true },
      ifSarcastic: { mood: 'angry', sentimentScore: -7.4, emotions: ['Annoyance'] } },
  ],
  ...extra,
});

/** Minimal Supabase stub recording what was written. */
function makeSupabase({ updateError = null, feedbackError = null, failFirstUpdateWith = null, stored = null } = {}) {
  const calls = { updates: [], upserts: [] };
  let first = true;
  return {
    calls,
    from: (table) => ({
      // latest stored row (what answerSarcasm re-reads); null = read found nothing / failed
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: stored, error: null }) }) }),
      update: (payload) => ({
        eq: async () => {
          calls.updates.push({ table, payload });
          if (first && failFirstUpdateWith) { first = false; return { error: failFirstUpdateWith }; }
          first = false;
          return { error: updateError };
        },
      }),
      upsert: async (row, opts) => {
        calls.upserts.push({ table, row, opts });
        return { error: feedbackError };
      },
    }),
  };
}

const entryWith = (analysis) => ({ id: 'e1', userId: 'u1', content: `${LINE_A} ${LINE_B}`, analysis });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('normLine', () => {
  test('ignores case, punctuation and spacing', () => {
    expect(normLine('  Great,   another ALL-hands at 8am!! ')).toBe('great another all hands at 8am');
    expect(normLine('')).toBe('');
    expect(normLine(null)).toBe('');
  });
});

describe('toStoredAnalysis', () => {
  test('drops raw scores/explanations and prunes answers for lines that no longer exist', () => {
    const stored = toStoredAnalysis(modelResult(), { [normLine(LINE_A)]: 'sarcastic', 'a line that was edited away': 'sincere' });
    expect(stored.lines[0]).not.toHaveProperty('explanation');
    expect(stored).not.toHaveProperty('scores');
    expect(stored.lines[0].ifSarcastic.mood).toBe('angry');
    expect(Object.keys(stored.answers)).toEqual([normLine(LINE_A)]);
    expect(stored.source).toBe('model');
  });
});

describe('analyzeEntry', () => {
  test('uses the model, passes earlier sarcastic answers, and takes themes from Gemini', async () => {
    analyzeWithModel.mockResolvedValue(modelResult());
    getThemes.mockResolvedValue(['Work']);
    const out = await analyzeEntry('text', { answers: { [normLine(LINE_A)]: 'sarcastic', other: 'sincere' } });
    expect(analyzeWithModel).toHaveBeenCalledWith('text', { confirmedTexts: [normLine(LINE_A)] });
    expect(out).toMatchObject({ mood: 'happy', themes: ['Work'], themesFailed: false, failed: false });
    expect(out.analysis.lines).toHaveLength(2);
    expect(analyzeEntryWithGemini).not.toHaveBeenCalled();
  });

  test('themes failing does not fail the analysis, and is reported so callers keep old themes', async () => {
    analyzeWithModel.mockResolvedValue(modelResult());
    getThemes.mockResolvedValue(null);
    const out = await analyzeEntry('text');
    expect(out).toMatchObject({ failed: false, themesFailed: true, themes: [] });
  });

  test('falls back to Gemini when the model service is down', async () => {
    analyzeWithModel.mockRejectedValue(new Error('network'));
    getThemes.mockResolvedValue(['x']);
    analyzeEntryWithGemini.mockResolvedValue({ sentimentScore: -1, emotions: ['Sadness'], themes: ['T'], mood: 'sad', failed: false });
    const out = await analyzeEntry('text');
    expect(out).toMatchObject({ mood: 'sad', themes: ['T'], analysis: null, themesFailed: false });
  });
});

describe('pendingSarcasmLines', () => {
  test('lists flagged lines not yet answered; none without analysis', () => {
    const a = toStoredAnalysis(modelResult(), {});
    expect(pendingSarcasmLines(entryWith(a))).toHaveLength(2);
    expect(pendingSarcasmLines(entryWith({ ...a, answers: { [normLine(LINE_A)]: 'skipped' } }))).toHaveLength(1);
    expect(pendingSarcasmLines({ id: 'x' })).toEqual([]);
    expect(pendingSarcasmLines(entryWith(null))).toEqual([]);
  });
  test('a line the model did not mark for review is never asked about', () => {
    const r = modelResult();
    r.lines[0].sarcasm.needsReview = false;
    expect(pendingSarcasmLines(entryWith(toStoredAnalysis(r, {})))).toHaveLength(1);
  });
});

describe('answerSarcasm', () => {
  const stored = () => toStoredAnalysis(modelResult(), {});

  test('"yes" re-runs the model with the line confirmed, updates mood/score, and logs the label', async () => {
    const corrected = modelResult({ sentimentScore: -0.7, mood: 'angry', emotions: ['Annoyance'] });
    corrected.lines[0] = { ...corrected.lines[0], adjusted: true, mood: 'angry', sentimentScore: -9.4,
      sarcasm: { probability: 0.99, flagged: true, confirmed: true, needsReview: false }, literal: { mood: 'happy', sentimentScore: 9.3, emotions: [] } };
    corrected.sarcasm = { needsReview: [1] };
    analyzeWithModel.mockResolvedValue(corrected);
    const sb = makeSupabase();
    const entry = entryWith(stored());

    await answerSarcasm({ supabase: sb, entry, line: entry.analysis.lines[0], answer: 'sarcastic', shareForTraining: true });

    expect(analyzeWithModel).toHaveBeenCalledWith(entry.content, { confirmedTexts: [normLine(LINE_A)] });
    const upd = sb.calls.updates[0].payload;
    expect(upd).toMatchObject({ sentiment_score: -0.7, mood: 'angry', emotions: ['Annoyance'] });
    expect(upd).not.toHaveProperty('themes');
    expect(upd.analysis.answers).toEqual({ [normLine(LINE_A)]: 'sarcastic' });
    expect(sb.calls.upserts[0].row).toMatchObject({ user_id: 'u1', entry_id: 'e1', user_label: 'sarcastic', share_for_training: true, model_probability: 0.99 });
    expect(sb.calls.upserts[0].opts).toEqual({ onConflict: 'user_id,entry_id,line_key' });
  });

  test('"no" changes nothing about the reading: no model call, answer remembered, label logged (not shared by default)', async () => {
    const sb = makeSupabase();
    const entry = entryWith(stored());
    await answerSarcasm({ supabase: sb, entry, line: entry.analysis.lines[1], answer: 'sincere' });
    expect(analyzeWithModel).not.toHaveBeenCalled();
    expect(Object.keys(sb.calls.updates[0].payload)).toEqual(['analysis']);
    expect(sb.calls.updates[0].payload.analysis.answers).toEqual({ [normLine(LINE_B)]: 'sincere' });
    expect(sb.calls.upserts[0].row).toMatchObject({ user_label: 'sincere', share_for_training: false });
  });

  test('"skip" is remembered but not logged as a label', async () => {
    const sb = makeSupabase();
    const entry = entryWith(stored());
    await answerSarcasm({ supabase: sb, entry, line: entry.analysis.lines[0], answer: 'skipped' });
    expect(sb.calls.updates).toHaveLength(1);
    expect(sb.calls.upserts).toHaveLength(0);
  });

  test('earlier answers are kept when answering another line', async () => {
    const sb = makeSupabase();
    const entry = entryWith({ ...stored(), answers: { [normLine(LINE_A)]: 'sincere' } });
    await answerSarcasm({ supabase: sb, entry, line: entry.analysis.lines[1], answer: 'skipped' });
    expect(sb.calls.updates[0].payload.analysis.answers).toEqual({ [normLine(LINE_A)]: 'sincere', [normLine(LINE_B)]: 'skipped' });
  });

  test('if the model is unreachable on "yes", it throws and writes nothing', async () => {
    analyzeWithModel.mockRejectedValue(new Error('down'));
    const sb = makeSupabase();
    const entry = entryWith(stored());
    await expect(answerSarcasm({ supabase: sb, entry, line: entry.analysis.lines[0], answer: 'sarcastic' })).rejects.toThrow('down');
    expect(sb.calls.updates).toHaveLength(0);
    expect(sb.calls.upserts).toHaveLength(0);
  });

  test('a failed entry update throws and logs no feedback', async () => {
    const sb = makeSupabase({ updateError: { message: 'boom' } });
    const entry = entryWith(stored());
    await expect(answerSarcasm({ supabase: sb, entry, line: entry.analysis.lines[1], answer: 'sincere' })).rejects.toEqual({ message: 'boom' });
    expect(sb.calls.upserts).toHaveLength(0);
  });

  test('builds on the LATEST stored answers, not a stale prop (answering two questions quickly)', async () => {
    const stale = entryWith(stored());            // what the card still has: no answers yet
    const latest = { content: stale.content, analysis: { ...stored(), answers: { [normLine(LINE_A)]: 'sincere' } } };
    const sb = makeSupabase({ stored: latest });
    await answerSarcasm({ supabase: sb, entry: stale, line: stale.analysis.lines[1], answer: 'skipped' });
    expect(sb.calls.updates[0].payload.analysis.answers).toEqual({
      [normLine(LINE_A)]: 'sincere',              // the earlier answer must survive
      [normLine(LINE_B)]: 'skipped',
    });
  });

  test('keeps the latest stored lines too, so a stale prop cannot undo an earlier correction', async () => {
    const stale = entryWith(stored());
    const corrected = toStoredAnalysis(modelResult(), { [normLine(LINE_A)]: 'sarcastic' });
    corrected.lines[0] = { ...corrected.lines[0], adjusted: true };
    const sb = makeSupabase({ stored: { content: stale.content, analysis: corrected } });
    await answerSarcasm({ supabase: sb, entry: stale, line: stale.analysis.lines[1], answer: 'sincere' });
    expect(sb.calls.updates[0].payload.analysis.lines[0].adjusted).toBe(true);
  });

  test('a "yes" re-analyses the latest stored text and all earlier sarcastic answers', async () => {
    analyzeWithModel.mockResolvedValue(modelResult());
    const stale = entryWith(stored());
    const latest = { content: 'edited text elsewhere', analysis: { ...stored(), answers: { [normLine(LINE_A)]: 'sarcastic' } } };
    const sb = makeSupabase({ stored: latest });
    await answerSarcasm({ supabase: sb, entry: stale, line: stale.analysis.lines[1], answer: 'sarcastic' });
    expect(analyzeWithModel).toHaveBeenCalledWith('edited text elsewhere', { confirmedTexts: [normLine(LINE_A), normLine(LINE_B)] });
  });

  test('a failed feedback log does not undo the answer', async () => {
    const sb = makeSupabase({ feedbackError: { message: 'rls' } });
    const entry = entryWith(stored());
    await expect(answerSarcasm({ supabase: sb, entry, line: entry.analysis.lines[1], answer: 'sincere' })).resolves.toBeUndefined();
  });
});

describe('updateEntryRow', () => {
  test('passes through on success', async () => {
    const sb = makeSupabase();
    const res = await updateEntryRow(sb, 'e1', { mood: 'sad', analysis: { v: 1 } });
    expect(res.error).toBeNull();
    expect(sb.calls.updates).toHaveLength(1);
  });

  test('retries without `analysis` when that column does not exist yet', async () => {
    const sb = makeSupabase({ failFirstUpdateWith: { code: 'PGRST204', message: "Could not find the 'analysis' column" } });
    const res = await updateEntryRow(sb, 'e1', { mood: 'sad', analysis: { v: 1 } });
    expect(res.error).toBeNull();
    expect(sb.calls.updates).toHaveLength(2);
    expect(sb.calls.updates[1].payload).toEqual({ mood: 'sad' });
  });

  test('does not retry for unrelated errors, or when analysis was not sent', async () => {
    const sb1 = makeSupabase({ failFirstUpdateWith: { code: '42501', message: 'permission denied' } });
    const r1 = await updateEntryRow(sb1, 'e1', { mood: 'sad', analysis: { v: 1 } });
    expect(r1.error.code).toBe('42501');
    expect(sb1.calls.updates).toHaveLength(1);

    const sb2 = makeSupabase({ failFirstUpdateWith: { code: 'PGRST204', message: 'analysis' } });
    const r2 = await updateEntryRow(sb2, 'e1', { mood: 'sad' });
    expect(r2.error).toBeTruthy();
    expect(sb2.calls.updates).toHaveLength(1);
  });
});
