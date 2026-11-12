/**
 * Client for the Emote emotion/sarcasm model service (ml/server.py).
 * Set REACT_APP_EMOTE_API_URL (e.g. http://localhost:8000) to enable it; when
 * unset the app falls back to Gemini for entry analysis.
 */
import { supabase } from '../../supabaseClient';

const BASE = (process.env.REACT_APP_EMOTE_API_URL || '').replace(/\/$/, '');

export const emotionApiConfigured = Boolean(BASE);

/**
 * @param {string} text
 * @param {{confirmedTexts?: string[], timeoutMs?: number}} [opts] lines the person
 *   already confirmed as sarcastic (matched by normalised text, so they survive edits)
 */
export async function analyzeWithModel(text, { confirmedTexts = [], timeoutMs = 90000 } = {}) {
  if (!emotionApiConfigured) throw new Error('Emotion API is not configured.');
  // The server only answers signed-in users: send the Supabase access token.
  const { data } = (await supabase?.auth.getSession()) ?? {};
  const token = data?.session?.access_token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ text, sarcasm_confirmed_texts: confirmedTexts }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Emotion API ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
