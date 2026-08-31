import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { analyzeEntry } from '../lib/gemini';
import { ACTIVITY_OPTIONS } from '../lib/moodMeta';

/**
 * Edit an existing journal entry in place. Re-runs AI analysis on save so
 * mood/emotions/themes stay consistent with the edited content — the same
 * behavior as creating a new entry.
 */
const EditEntryModal = ({ entry, onClose }) => {
  const [title, setTitle] = useState(entry.title || '');
  const [content, setContent] = useState(entry.content || '');
  const [selectedActivities, setSelectedActivities] = useState(entry.activities || []);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const handleToggleActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim() || !supabase) return;
    setIsSaving(true);
    setError('');
    setStatusMessage('Analyzing...');

    const activityLabels = {};
    selectedActivities.forEach((key) => {
      const opt = ACTIVITY_OPTIONS.find((o) => o.key === key);
      if (opt) activityLabels[key] = opt.label;
    });

    const analysis = await analyzeEntry(content);

    setStatusMessage('Saving...');
    const update = {
      title: title || '',
      content,
      activities: selectedActivities,
      activity_labels: activityLabels,
    };
    if (!analysis.failed) {
      update.sentiment_score = analysis.sentimentScore;
      update.emotions = analysis.emotions;
      update.themes = analysis.themes;
      update.mood = analysis.mood;
    }

    const { error: updateError } = await supabase.from('journal_entries').update(update).eq('id', entry.id);
    setIsSaving(false);
    if (updateError) {
      console.error('Update entry error:', updateError);
      setError('Could not save changes. Try again.');
      setStatusMessage('');
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-emote-ink/40 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-entry-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-emote-border bg-emote-surface shadow-emote shadow-emote-glow">
        <div className="flex items-start justify-between gap-4 border-b border-emote-border p-5">
          <h2 id="edit-entry-title" className="text-emote-card-title font-semibold text-emote-ink">
            Edit entry
          </h2>
          <button type="button" onClick={onClose} className="emote-icon-btn h-9 w-9" aria-label="Close">
            <span className="text-emote-page leading-none text-emote-ink-faint">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {error ? <p className="emote-banner-warn">{error}</p> : null}

          <div>
            <label htmlFor="edit-title" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="emote-input"
              placeholder="Optional — a few words to find this later"
            />
          </div>

          <div>
            <label htmlFor="edit-body" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint">
              Entry
            </label>
            <textarea
              id="edit-body"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="emote-input min-h-[200px] resize-y"
            />
          </div>

          <div>
            <p className="mb-1 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Activities</p>
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

          <div className="flex justify-end gap-2 border-t border-emote-border pt-5">
            <button type="button" onClick={onClose} className="emote-btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !content.trim()}
              className="emote-btn-primary min-w-[160px] disabled:cursor-not-allowed"
            >
              {isSaving ? statusMessage || 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEntryModal;
