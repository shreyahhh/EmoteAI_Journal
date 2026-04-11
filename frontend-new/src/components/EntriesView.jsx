import React, { useMemo, useState } from 'react';
import JournalEntryCard from './JournalEntryCard';
import { getCreatedAtDate } from '../lib/entryDates';

const MOODS = [
  { id: 'all', label: 'All moods' },
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'angry', label: 'Angry' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'neutral', label: 'Neutral' },
];

const DATE_PRESETS = [
  { id: 'all', label: 'Any time' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
];

function filterEntries(entries, query, moodId, datePresetId) {
  let list = entries;
  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (e) =>
        (e.title || '').toLowerCase().includes(q) || (e.content || '').toLowerCase().includes(q),
    );
  }
  if (moodId !== 'all') {
    list = list.filter((e) => (e.mood || 'neutral') === moodId);
  }
  if (datePresetId !== 'all') {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[datePresetId];
    if (days != null) {
      const cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter((e) => {
        const d = getCreatedAtDate(e);
        return d && !Number.isNaN(d.getTime()) && d >= cutoff;
      });
    }
  }
  return list;
}

const EntriesView = ({ entries, onDeleteEntry }) => {
  const [query, setQuery] = useState('');
  const [moodId, setMoodId] = useState('all');
  const [datePresetId, setDatePresetId] = useState('all');

  const filtered = useMemo(
    () => filterEntries(entries, query, moodId, datePresetId),
    [entries, query, moodId, datePresetId],
  );

  const hasActiveFilters =
    query.trim() !== '' || moodId !== 'all' || datePresetId !== 'all';

  const clearFilters = () => {
    setQuery('');
    setMoodId('all');
    setDatePresetId('all');
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-emote-body font-medium text-slate-800">No entries yet</p>
        <p className="mt-2 text-emote-muted leading-relaxed text-slate-500">
          Go to Journal, write something, and save—your cards will show up here.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-5 text-emote-muted leading-relaxed text-slate-500">
        Open a card to read the full entry or jump to history. Newest posts appear at the top of the list.
      </p>

      <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5">
          <div className="min-w-0 flex-1">
            <label htmlFor="entries-search" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-slate-500">
              Search
            </label>
            <input
              id="entries-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title or body text…"
              autoComplete="off"
              className="emote-input"
            />
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-md lg:flex-none lg:shrink-0">
            <div>
              <label htmlFor="entries-mood" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-slate-500">
                Mood
              </label>
              <select
                id="entries-mood"
                value={moodId}
                onChange={(e) => setMoodId(e.target.value)}
                className="emote-input cursor-pointer py-2.5"
              >
                {MOODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="entries-date" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-slate-500">
                Date
              </label>
              <select
                id="entries-date"
                value={datePresetId}
                onChange={(e) => setDatePresetId(e.target.value)}
                className="emote-input cursor-pointer py-2.5"
              >
                {DATE_PRESETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <p className="text-emote-muted text-slate-600">
            Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{entries.length}</span>
          </p>
          {hasActiveFilters ? (
            <button type="button" onClick={clearFilters} className="emote-btn-ghost py-2 text-emote-muted">
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-emote-body font-medium text-slate-800">No matching entries</p>
          <p className="mt-2 text-emote-muted leading-relaxed text-slate-500">
            Try different search words, mood, or date range—or clear filters to see everything again.
          </p>
          <button type="button" onClick={clearFilters} className="emote-btn-primary mt-5">
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-6 xl:grid-cols-2">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <JournalEntryCard
                entry={entry}
                onDelete={onDeleteEntry ? () => onDeleteEntry(entry.id) : undefined}
                showHistoryButton
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default EntriesView;
