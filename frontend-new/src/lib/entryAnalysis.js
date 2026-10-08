import { analyzeEntryWithGemini, getThemes } from './gemini';
import { analyzeWithModel, emotionApiConfigured } from './emotionApi';
import { normLine } from './sarcasmKeys';

export const sarcasticKeys = (answers) =>
  Object.entries(answers || {})
    .filter(([, v]) => v === 'sarcastic')
    .map(([k]) => k);

/**
 * Compact form of the model's per-line result for journal_entries.analysis:
 * drops the raw label scores / explanations, and keeps only answers that still
 * match a line in the entry.
 */
export function toStoredAnalysis(result, answers = {}) {
  const lines = (result.lines || []).map((l) => ({
    text: l.text,
    start: l.start,
    end: l.end,
    mood: l.mood,
    sentimentScore: l.sentimentScore,
    emotions: l.emotions,
    adjusted: Boolean(l.adjusted),
    sarcasm: l.sarcasm,
    ...(l.ifSarcastic ? { ifSarcastic: l.ifSarcastic } : {}),
    ...(l.literal ? { literal: l.literal } : {}),
  }));
  const present = new Set(lines.map((l) => normLine(l.text)));
  const kept = Object.fromEntries(Object.entries(answers).filter(([k]) => present.has(k)));
  return {
    v: 1,
    source: 'model',
    lines,
    sarcasm: { needsReview: result.sarcasm?.needsReview || [] },
    mixed: Boolean(result.mixed),
    truncated: Boolean(result.truncated),
    totalLines: result.totalLines ?? lines.length,
    answers: kept,
  };
}

/**
 * Analyze one journal entry. Uses the trained emotion + sarcasm model when
 * REACT_APP_EMOTE_API_URL is set (themes still come from Gemini, best effort);
 * otherwise, or if the model service is unreachable, falls back to Gemini.
 *
 * @param {string} text
 * @param {{answers?: Object}} [opts] earlier answers to "did you mean that
 *   sarcastically?", keyed by normalised line text
 * @returns {Promise<{sentimentScore:number, emotions:string[], themes:string[],
 *   themesFailed:boolean, mood:string, failed:boolean, analysis:Object|null}>}
 */
export async function analyzeEntry(text, { answers = {} } = {}) {
  if (emotionApiConfigured) {
    try {
      const [model, themes] = await Promise.all([
        analyzeWithModel(text, { confirmedTexts: sarcasticKeys(answers) }),
        getThemes(text),
      ]);
      return {
        sentimentScore: model.sentimentScore,
        emotions: model.emotions,
        mood: model.mood,
        themes: themes ?? [],
        themesFailed: themes == null,
        failed: false,
        analysis: toStoredAnalysis(model, answers),
      };
    } catch (error) {
      console.error('Emotion model unavailable, falling back to Gemini:', error);
    }
  }
  const g = await analyzeEntryWithGemini(text);
  return { ...g, themesFailed: Boolean(g.failed), analysis: null };
}
