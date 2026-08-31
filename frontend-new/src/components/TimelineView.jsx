import React, { useState, useMemo } from 'react';
import { getCreatedAtDate } from '../lib/entryDates';
import { getMoodTagStyle } from '../lib/moodMeta';

const MoodTag = ({ mood, emotions }) => {
  const displayMood = (mood || (emotions && emotions[0]) || 'neutral').toLowerCase();
  return (
    <span className={`rounded-lg px-2.5 py-1 text-emote-caption font-semibold ring-1 ring-inset ${getMoodTagStyle(displayMood)}`}>
      {displayMood.charAt(0).toUpperCase() + displayMood.slice(1)}
    </span>
  );
};

const TimelineView = ({ entries }) => {
  const [selectedEntry, setSelectedEntry] = useState(null);

  const entriesByMonth = useMemo(() => {
    const groups = {};
    entries.forEach((entry) => {
      const d = getCreatedAtDate(entry);
      const monthYear = d ? d.toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Unknown date';
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(entry);
    });
    return groups;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="emote-panel text-center">
        <h3 className="text-emote-card-title font-semibold text-emote-ink">Your timeline is empty</h3>
        <p className="mt-2 text-emote-muted leading-relaxed text-emote-ink-faint">
          Each saved entry gets a date; once you have a few, this view groups them by month with a simple vertical line.
        </p>
      </div>
    );
  }

  return (
    <>
      {selectedEntry && <FullEntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}

      <div className="mx-auto max-w-4xl">
        <p className="mb-6 text-emote-muted leading-relaxed text-emote-ink-faint">
          Scroll the months on the left rail—click any row to open the full entry in a modal.
        </p>
        {Object.entries(entriesByMonth).map(([monthYear, monthEntries]) => (
          <div key={monthYear} className="relative border-l-2 border-emote-border-strong py-6 pl-8">
            <div className="absolute -left-[6px] top-9 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emote-accent-2 via-emote-accent to-emote-gold ring-4 ring-emote-surface" />
            <h2 className="emote-title-gradient mb-6 text-xl sm:text-2xl">{monthYear}</h2>
            <div className="space-y-3">
              {monthEntries.map((entry) => (
                <TimelineEntryCard key={entry.id} entry={entry} onClick={() => setSelectedEntry(entry)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const TimelineEntryCard = ({ entry, onClick }) => {
  const d = getCreatedAtDate(entry);
  const day = d ? d.getDate() : new Date().getDate();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-emote-border bg-emote-surface p-4 text-left shadow-sm transition hover:border-emote-border-strong hover:bg-emote-surface-alt/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emote-accent/50"
    >
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emote-gold/15 to-emote-accent/10 ring-1 ring-emote-border-strong/60">
        <span className="text-emote-card-title font-bold text-emote-accent-2">{day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-emote-card-title font-semibold text-emote-ink">{entry.title || 'Untitled entry'}</p>
        <p className="text-emote-muted text-emote-ink-soft">Open to read</p>
      </div>
      <div className="shrink-0">
        <MoodTag mood={entry.mood} emotions={entry.emotions} />
      </div>
    </button>
  );
};

const FullEntryModal = ({ entry, onClose }) => {
  const formattedDate = useMemo(() => {
    const date = getCreatedAtDate(entry);
    if (!date) return null;
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' }).toUpperCase();
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }, [entry]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-emote-border bg-emote-surface p-6 shadow-emote shadow-emote-glow">
        <div className="mb-4 flex flex-shrink-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="emote-title-gradient text-emote-section">{entry.title || 'Untitled entry'}</h2>
            {formattedDate && <p className="mt-1 text-emote-muted text-emote-ink-faint">{formattedDate}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="emote-icon-btn h-9 w-9"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emote-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <p className="whitespace-pre-wrap text-emote-body leading-relaxed text-emote-ink-soft">{entry.content}</p>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
