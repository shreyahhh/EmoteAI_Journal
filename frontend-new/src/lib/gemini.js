import { supabase } from '../supabaseClient';

const MOOD_KEYS = ['happy', 'sad', 'angry', 'anxious', 'neutral'];

function normalizeMood(value) {
  const s = String(value || '').toLowerCase();
  return MOOD_KEYS.includes(s) ? s : 'neutral';
}

/**
 * Every AI call is relayed through the `gemini-proxy` Supabase Edge Function
 * so the Gemini API key never reaches the browser. See
 * supabase/functions/gemini-proxy/index.ts.
 */
async function callGemini(payload) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { payload },
  });
  if (error) throw error;
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts?.[0]?.text) throw new Error('Empty response from AI.');
  return parts[0].text;
}

/** Analyze one journal entry: sentiment, emotions, themes, mood. */
export async function analyzeEntry(text) {
  const prompt = `
        As a compassionate psychologist, analyze the following journal entry.
        Provide your analysis in a structured JSON format. Do not include any text outside of the JSON object.
        The JSON object should have the following keys:
        - "sentimentScore": A number from -10 (extremely negative) to 10 (extremely positive).
        - "emotions": An array of 2-4 strings identifying the dominant emotions (e.g., "Sadness", "Frustration", "Hope").
        - "themes": An array of 2-3 strings identifying the key themes or topics (e.g., "Work Stress", "Family Conflict").
        - "mood": Exactly one of: "happy", "sad", "angry", "anxious", "neutral" — the single best label for the overall tone of the entry.
        Journal Entry:
        ---
        ${text}
        ---
    `;
  try {
    const raw = await callGemini({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const analysis = JSON.parse(raw);
    return {
      sentimentScore: analysis.sentimentScore ?? 0,
      emotions: Array.isArray(analysis.emotions) ? analysis.emotions : [],
      themes: Array.isArray(analysis.themes) ? analysis.themes : ['General'],
      mood: normalizeMood(analysis.mood),
      failed: false,
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return { sentimentScore: 0, emotions: [], themes: [], mood: 'neutral', failed: true };
  }
}

/** Weekly recap across a batch of entries. */
export async function getWeeklySummary(entriesText) {
  const prompt = `
        As a compassionate psychologist, you are reviewing a client's journal entries from the past week.
        Please provide a gentle and insightful summary based on the text provided.
        Provide your response in a structured JSON format. Do not include any text outside of the JSON object.
        The JSON object should have the following keys:
        - "overallFeeling": A short paragraph (2-3 sentences) summarizing the overall emotional tone of the week.
        - "keyThemes": An array of 2-4 strings identifying the most prominent themes or topics.
        - "positiveMoment": A short paragraph highlighting a specific positive moment or feeling mentioned in the entries. If no clear positive moment exists, create a gentle encouragement.
        - "gentleSuggestion": A single, forward-looking, and encouraging suggestion for the week ahead.
        Journal Entries Text:
        ---
        ${entriesText}
        ---
    `;
  try {
    const raw = await callGemini({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return JSON.parse(raw);
  } catch (error) {
    console.error('AI summary error:', error);
    return {
      overallFeeling: 'An error occurred while analyzing your week.',
      keyThemes: [],
      positiveMoment: '',
      gentleSuggestion: 'Try to be kind to yourself this week.',
    };
  }
}

/** Tips/exercise/affirmation content for a Resources topic. */
export async function getResourceContent(topic) {
  const prompt = `
        As a compassionate psychologist, provide helpful content for someone struggling with "${topic}".
        Provide your response in a structured JSON format. Do not include any text outside of the JSON object.
        The JSON object should have the following keys:
        - "title": A string with the title of the resource (e.g., "Guidance for ${topic}").
        - "tips": An array of 3-4 strings, each being a short, actionable tip.
        - "exercise": An object with "title" and "steps" (an array of strings) for a simple, helpful exercise.
        - "affirmation": A single, encouraging affirmation string.
        Topic: "${topic}"
    `;
  try {
    const raw = await callGemini({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return JSON.parse(raw);
  } catch (error) {
    console.error('AI resource generation error:', error);
    return {
      title: 'Error Generating Content',
      tips: [],
      exercise: { title: '', steps: [] },
      affirmation: 'Could not generate content at this time.',
    };
  }
}

/** Chat answer grounded in the user's own recent entries. */
export async function getChatResponse(question, entriesText) {
  const prompt = `
        You are "Emote," a compassionate and insightful AI assistant for a personal journal app.
        Your user is asking you a question about their past entries.
        Your task is to answer the user's question based *only* on the provided journal entries.
        Do not make up information or provide generic advice. Ground your entire response in the text provided.
        Keep your answer conversational and supportive.

        Here is the user's question:
        "${question}"

        Here are the relevant journal entries from the last 30 days:
        ---
        ${entriesText}
        ---

        Your Answer:
    `;
  try {
    return await callGemini({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
  } catch (error) {
    console.error('AI chat error:', error);
    return "Sorry, I couldn't connect. Please check your connection and try again.";
  }
}
