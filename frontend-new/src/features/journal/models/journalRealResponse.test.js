/**
 * Runs the frontend's analysis handling against a REAL response captured from
 * ml/server.py (see __fixtures__/analyze-response.json), so a change in the
 * server's output shape is caught here and not only by hand-built mocks.
 */
import fixture from './__fixtures__/analyze-response.json';
import { toStoredAnalysis } from './journalEntryAnalysis';
import { pendingSarcasmLines } from './journalSarcasmFeedback';
import { normLine } from './journalSarcasmKeys';

describe('real /analyze response', () => {
  const stored = toStoredAnalysis(fixture.plain, {});
  const entry = { id: 'e1', userId: 'u1', content: fixture.text, analysis: stored };

  test('line offsets index back into the entry text', () => {
    stored.lines.forEach((l) => expect(fixture.text.slice(l.start, l.end)).toBe(l.text));
  });

  test('flagged positive lines are queued for the question, each with the alternative reading', () => {
    const pending = pendingSarcasmLines(entry);
    expect(pending.map((l) => l.text)).toEqual([
      'I finally got the promotion I worked so hard for!',
      'Great, another all-hands at 8am on a Monday, just what I needed.',
    ]);
    pending.forEach((l) => {
      expect(l.sarcasm.needsReview).toBe(true);
      expect(l.ifSarcastic).toMatchObject({ mood: expect.any(String), sentimentScore: expect.any(Number) });
      expect(l.ifSarcastic.sentimentScore).toBeLessThan(0);
    });
  });

  test('without confirmation the stored entry keeps the literal reading', () => {
    expect(stored.lines.some((l) => l.adjusted)).toBe(false);
    expect(fixture.plain.mood).toBe('happy');
  });

  test('after the server applies a confirmation matched by text, that line is no longer pending', () => {
    const answers = { [normLine('Great, another all-hands at 8am on a Monday, just what I needed.')]: 'sarcastic' };
    const after = toStoredAnalysis(fixture.confirmedLine2, answers);
    const confirmedEntry = { ...entry, analysis: after };
    expect(pendingSarcasmLines(confirmedEntry)).toHaveLength(1);
    const line2 = after.lines[2];
    expect(line2.adjusted).toBe(true);
    expect(line2.literal.mood).toBe('happy');
    expect(line2.mood).toBe('angry');
    expect(fixture.confirmedLine2.sentimentScore).toBeLessThan(fixture.plain.sentimentScore);
  });

  test('stored analysis stays small (it is saved on every entry)', () => {
    expect(JSON.stringify(stored).length).toBeLessThan(4000);
  });
});
