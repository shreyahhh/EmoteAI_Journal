import React, { useState } from 'react';
import PencilIcon from './PencilIcon';
import TrashIcon from './TrashIcon';
import EntryHistoryModal from './EntryHistoryModal';
import { formatCreatedAt } from '../lib/entryDates';

const JournalEntryCard = ({ entry, onEdit, onDelete, onThemeClick, showHistoryButton = true }) => {
  const moodEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    anxious: '😟',
    neutral: '😐',
  };

  const formattedDate = formatCreatedAt(entry);
  const tagChip = 'rounded-lg px-2.5 py-1 text-emote-caption font-medium ring-1 ring-inset';
  const [historyOpen, setHistoryOpen] = useState(false);

  const openHistory = () => setHistoryOpen(true);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-emote transition hover:border-sky-200 hover:shadow-md">
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-gradient-to-br from-sky-100/80 via-rose-50 to-amber-50 opacity-80 blur-2xl transition group-hover:opacity-100" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <time className="rounded-lg bg-sky-100 px-2.5 py-1 text-emote-caption font-semibold text-sky-800 ring-1 ring-sky-200/80">
              {formattedDate}
            </time>
            <span className="text-emote-page leading-none" title={entry.mood || 'neutral'}>
              {moodEmojis[entry.mood] || '😐'}
            </span>
          </div>
          <h3 className="text-emote-card-title font-semibold tracking-tight text-slate-900">{entry.title || 'Untitled entry'}</h3>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:flex-col sm:items-end sm:gap-2">
          {showHistoryButton ? (
            <button
              type="button"
              onClick={openHistory}
              className="rounded-lg px-3 py-1.5 text-emote-caption font-semibold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
            >
              History
            </button>
          ) : null}
          <div className="flex gap-1">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-teal-50 hover:text-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40"
                aria-label="Edit entry"
              >
                <PencilIcon />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                aria-label="Delete entry"
              >
                <TrashIcon />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <p className="relative mt-3 whitespace-pre-wrap text-emote-body leading-relaxed text-slate-600">{entry.content}</p>

      {(entry.emotions?.length > 0 || entry.themes?.length > 0 || entry.activities?.length > 0) && (
        <div className="relative mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          {entry.emotions?.map((emotion, index) => (
            <span key={`emo-${index}`} className={`${tagChip} bg-amber-50 text-amber-900 ring-amber-200`}>
              {emotion}
            </span>
          ))}
          {entry.themes?.map((theme, index) => (
            <button
              type="button"
              key={`theme-${index}`}
              onClick={() => onThemeClick && onThemeClick(theme)}
              className={`${tagChip} bg-rose-50 text-rose-900 ring-rose-200 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300`}
            >
              {theme}
            </button>
          ))}
          {entry.activities?.map((actKey, index) => {
            const label = entry.activityLabels?.[actKey] || actKey;
            return (
              <span key={`act-${index}`} className={`${tagChip} bg-teal-50 text-teal-900 ring-teal-200`}>
                {label}
              </span>
            );
          })}
        </div>
      )}

      {showHistoryButton && historyOpen ? (
        <EntryHistoryModal entryId={entry.id} entryTitle={entry.title} onClose={() => setHistoryOpen(false)} />
      ) : null}
    </article>
  );
};

export default JournalEntryCard;
