import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const MOODS = ['happy', 'sad', 'angry', 'anxious', 'neutral'];

function normalizeMood(value) {
  const s = String(value || '').toLowerCase();
  return MOODS.includes(s) ? s : 'neutral';
}

async function analyzeEntryWithAI(text) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
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
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const result = await response.json();
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
      const analysis = JSON.parse(result.candidates[0].content.parts[0].text);
      return {
        sentimentScore: analysis.sentimentScore ?? 0,
        emotions: Array.isArray(analysis.emotions) ? analysis.emotions : [],
        themes: Array.isArray(analysis.themes) ? analysis.themes : ['General'],
        mood: normalizeMood(analysis.mood),
      };
    }
    return { sentimentScore: 0, emotions: [], themes: ['General'], mood: 'neutral' };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return { sentimentScore: 0, emotions: ['Analysis Error'], themes: [], mood: 'neutral' };
  }
}

const JournalView = ({ user }) => {
  const [currentEntry, setCurrentEntry] = useState({ title: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);

  const activityOptions = [
    { key: 'exercise', label: 'Exercise' },
    { key: 'work', label: 'Work' },
    { key: 'social', label: 'Social' },
    { key: 'hobby', label: 'Hobby' },
    { key: 'rest', label: 'Rest' },
    { key: 'family', label: 'Family' },
    { key: 'chores', label: 'Chores' },
    { key: 'nature', label: 'Nature' },
  ];

  const handleToggleActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    );
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!currentEntry.content.trim() || !supabase || !user?.id) return;
    setIsSaving(true);
    setStatusMessage('Analyzing...');
    const analysis = await analyzeEntryWithAI(currentEntry.content);
    const activityLabels = {};
    selectedActivities.forEach((key) => {
      const opt = activityOptions.find((o) => o.key === key);
      if (opt) activityLabels[key] = opt.label;
    });
    setStatusMessage('Saving...');
    const { error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: currentEntry.title || '',
      content: currentEntry.content,
      sentiment_score: analysis.sentimentScore,
      emotions: analysis.emotions,
      themes: analysis.themes,
      activities: selectedActivities,
      activity_labels: activityLabels,
      mood: analysis.mood,
    });
    if (error) {
      console.error('Save entry error:', error);
      setStatusMessage('Could not save. Try again.');
      setIsSaving(false);
      setTimeout(() => setStatusMessage(''), 4000);
      return;
    }
    setCurrentEntry({ title: '', content: '' });
    setSelectedActivities([]);
    setIsSaving(false);
    setStatusMessage('');
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="New journal entry">
        <div className="emote-panel relative overflow-hidden border-slate-200/90 p-5 sm:p-8">
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-sky-50/50 via-transparent to-rose-50/30" />
          <p className="relative z-10 mb-5 text-emote-muted leading-relaxed text-slate-600">
            Use a title if it helps you find this later. When you save, we infer mood and themes from what you wrote—no extra steps.
          </p>
          <form onSubmit={handleSaveEntry} className="relative z-10 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label
                  htmlFor="journal-title"
                  className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-slate-500"
                >
                  Title
                </label>
                <input
                  id="journal-title"
                  type="text"
                  value={currentEntry.title}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, title: e.target.value })}
                  placeholder="Optional — a few words to find this later"
                  className="emote-input"
                />
              </div>
              <div className="lg:col-span-2">
                <label
                  htmlFor="journal-body"
                  className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-slate-500"
                >
                  Entry
                </label>
                <textarea
                  id="journal-body"
                  value={currentEntry.content}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, content: e.target.value })}
                  placeholder="What’s on your mind?"
                  rows={6}
                  className="emote-input min-h-[160px] resize-y sm:min-h-[200px]"
                />
              </div>
            </div>

            <div>
              <p className="mb-1 text-emote-caption font-semibold uppercase tracking-wide text-slate-500">Activities</p>
              <p className="mb-3 text-emote-muted text-slate-500">Optional tags—Insights can show how activities relate to brighter days.</p>
              <div className="flex flex-wrap gap-2">
                {activityOptions.map((activity) => (
                  <button
                    type="button"
                    key={activity.key}
                    onClick={() => handleToggleActivity(activity.key)}
                    className={`rounded-full px-3.5 py-1.5 text-emote-muted font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/60 ${
                      selectedActivities.includes(activity.key)
                        ? 'bg-gradient-to-r from-rose-100 to-amber-100 text-rose-900 ring-1 ring-orange-200'
                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    {activity.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="submit"
                disabled={isSaving || !currentEntry.content.trim() || !supabase}
                className="emote-btn-primary w-full sm:w-auto sm:min-w-[200px] disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {statusMessage}
                  </span>
                ) : (
                  'Save entry'
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default JournalView;
