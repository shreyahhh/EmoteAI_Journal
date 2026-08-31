import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { analyzeEntry } from '../lib/gemini';
import { ACTIVITY_OPTIONS } from '../lib/moodMeta';

const JournalView = ({ user }) => {
  const [currentEntry, setCurrentEntry] = useState({ title: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);

  const handleToggleActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    );
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!currentEntry.content.trim() || !supabase || !user?.id) return;
    setIsSaving(true);
    setStatusMessage('Saving...');

    const activityLabels = {};
    selectedActivities.forEach((key) => {
      const opt = ACTIVITY_OPTIONS.find((o) => o.key === key);
      if (opt) activityLabels[key] = opt.label;
    });

    // Save immediately so the app never blocks on the AI call; the entry is
    // updated in place (and picked up by Dashboard's realtime subscription)
    // once analysis finishes.
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title: currentEntry.title || '',
        content: currentEntry.content,
        sentiment_score: null,
        emotions: [],
        themes: [],
        activities: selectedActivities,
        activity_labels: activityLabels,
        mood: 'neutral',
      })
      .select()
      .single();

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

    analyzeEntry(currentEntry.content).then((analysis) => {
      if (analysis.failed) return;
      supabase
        .from('journal_entries')
        .update({
          sentiment_score: analysis.sentimentScore,
          emotions: analysis.emotions,
          themes: analysis.themes,
          mood: analysis.mood,
        })
        .eq('id', data.id)
        .then(({ error: updateError }) => {
          if (updateError) console.error('Analysis update error:', updateError);
        });
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="New journal entry">
        <div className="emote-panel relative overflow-hidden border-emote-border/90 p-5 sm:p-8">
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-emote-accent/10 via-transparent to-emote-gold/10" />
          <p className="relative z-10 mb-5 text-emote-muted leading-relaxed text-emote-ink-soft">
            Use a title if it helps you find this later. When you save, we infer mood and themes from what you wrote—no extra steps.
          </p>
          <form onSubmit={handleSaveEntry} className="relative z-10 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label
                  htmlFor="journal-title"
                  className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint"
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
                  className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint"
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
              <p className="mb-1 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Activities</p>
              <p className="mb-3 text-emote-muted text-emote-ink-faint">Optional tags—Insights can show how activities relate to brighter days.</p>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_OPTIONS.map((activity) => (
                  <button
                    type="button"
                    key={activity.key}
                    onClick={() => handleToggleActivity(activity.key)}
                    className={`rounded-full px-3.5 py-1.5 text-emote-muted font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emote-accent/60 ${
                      selectedActivities.includes(activity.key)
                        ? 'bg-gradient-to-r from-emote-accent-2/20 to-emote-gold/20 text-emote-ink ring-1 ring-emote-accent/30'
                        : 'border border-emote-border bg-emote-surface-alt text-emote-ink-soft hover:border-emote-border-strong hover:bg-emote-surface'
                    }`}
                  >
                    {activity.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-emote-border pt-5 sm:flex-row sm:items-center sm:justify-end">
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
