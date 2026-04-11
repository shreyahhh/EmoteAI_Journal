import React, { useState, useMemo } from 'react';
import { getCreatedAtDate } from '../lib/entryDates';

const MoodTag = ({ mood, emotions }) => {
  const displayMood = (mood || (emotions && emotions[0]) || 'neutral').toLowerCase();
  const moodStyles = {
    happy: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    sad: 'bg-sky-50 text-sky-800 ring-sky-200',
    angry: 'bg-rose-50 text-rose-800 ring-rose-200',
    anxious: 'bg-amber-50 text-amber-900 ring-amber-200',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  };
  return (
    <span className={`rounded-lg px-2.5 py-1 text-emote-caption font-semibold ring-1 ring-inset ${moodStyles[displayMood] || moodStyles.neutral}`}>
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
        <h3 className="text-emote-card-title font-semibold text-slate-900">Your timeline is empty</h3>
        <p className="mt-2 text-emote-muted leading-relaxed text-slate-500">
          Each saved entry gets a date; once you have a few, this view groups them by month with a simple vertical line.
        </p>
      </div>
    );
  }

  return (
    <>
      {selectedEntry && <FullEntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}

      <div className="mx-auto max-w-4xl">
        <p className="mb-6 text-emote-muted leading-relaxed text-slate-500">
          Scroll the months on the left rail—click any row to open the full entry in a modal.
        </p>
        {Object.entries(entriesByMonth).map(([monthYear, monthEntries]) => (
          <div key={monthYear} className="relative border-l-2 border-sky-200 py-6 pl-8">
            <div className="absolute -left-[6px] top-9 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-sky-400 via-rose-400 to-amber-400 ring-4 ring-white" />
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
      className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
    >
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-rose-50 ring-1 ring-sky-200/80">
        <span className="text-emote-card-title font-bold text-sky-800">{day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-emote-card-title font-semibold text-slate-900">{entry.title || 'Untitled entry'}</p>
        <p className="text-emote-muted text-slate-600">Open to read</p>
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
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-emote shadow-emote-glow">
        <div className="mb-4 flex flex-shrink-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="emote-title-gradient text-emote-section">{entry.title || 'Untitled entry'}</h2>
            {formattedDate && <p className="mt-1 text-emote-muted text-slate-500">{formattedDate}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="emote-icon-btn h-9 w-9"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <p className="whitespace-pre-wrap text-emote-body leading-relaxed text-slate-700">{entry.content}</p>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
