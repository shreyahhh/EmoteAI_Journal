import React, { useState } from 'react';
import PencilIcon from './PencilIcon';
import TrashIcon from './TrashIcon';
import EntryHistoryModal from './EntryHistoryModal';
import EditEntryModal from './EditEntryModal';
import { formatCreatedAt } from '../lib/entryDates';
import { MOOD_EMOJIS } from '../lib/moodMeta';

const JournalEntryCard = ({
  entry,
  onEdit,
  onDelete,
  onThemeClick,
  showHistoryButton = true,
  showEditButton = true,
  uniformHeight = false,
}) => {
  const formattedDate = formatCreatedAt(entry);
  const tagChip = 'rounded-lg px-2.5 py-1 text-emote-caption font-medium ring-1 ring-inset';
  const tagChipCompact =
    'rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset sm:text-xs';
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const openHistory = () => setHistoryOpen(true);
  const handleEdit = onEdit || (() => setEditOpen(true));

  const chipClass = uniformHeight ? tagChipCompact : tagChip;

  const articleLayout = uniformHeight
    ? 'flex h-full w-full min-h-[13rem] flex-col rounded-xl p-4 sm:min-h-[14rem]'
    : 'rounded-2xl p-6';

  const bodyClass = uniformHeight
    ? 'relative mt-2 min-h-0 flex-1 overflow-hidden text-sm leading-snug text-emote-ink-soft line-clamp-4'
    : 'relative mt-3 whitespace-pre-wrap text-emote-body leading-relaxed text-emote-ink-soft';

  const tagsWrapClass = uniformHeight
    ? 'relative mt-auto flex flex-wrap gap-1.5 border-t border-emote-border pt-3'
    : 'relative mt-5 flex flex-wrap gap-2 border-t border-emote-border pt-5';

  const hasTags =
    (entry.emotions?.length > 0 || entry.themes?.length > 0 || entry.activities?.length > 0) ?? false;

  return (
    <article
      className={`group relative overflow-hidden border border-emote-border bg-emote-surface shadow-emote transition hover:border-emote-border-strong hover:shadow-md ${articleLayout}`}
    >
      <div
        className={`pointer-events-none absolute rounded-full bg-gradient-to-br from-emote-accent-2/20 via-emote-accent/10 to-emote-gold/20 opacity-80 blur-2xl transition group-hover:opacity-100 ${uniformHeight ? '-right-10 -top-10 h-24 w-24' : '-right-16 -top-16 h-36 w-36'}`}
      />

      <div
        className={`relative flex shrink-0 flex-col sm:flex-row sm:items-start sm:justify-between ${uniformHeight ? 'gap-2 sm:gap-2' : 'gap-4'}`}
      >
        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-center ${uniformHeight ? 'mb-1 gap-1.5' : 'mb-2 gap-2'}`}>
            <time
              className={`rounded-lg bg-emote-accent/10 font-semibold text-emote-accent-2 ring-1 ring-emote-accent/30 ${uniformHeight ? 'px-2 py-0.5 text-[11px] sm:text-xs' : 'px-2.5 py-1 text-emote-caption'}`}
            >
              {formattedDate}
            </time>
            <span
              className={`leading-none ${uniformHeight ? 'text-base' : 'text-emote-page'}`}
              title={entry.mood || 'neutral'}
            >
              {MOOD_EMOJIS[entry.mood] || MOOD_EMOJIS.neutral}
            </span>
          </div>
          <h3
            className={`font-semibold tracking-tight text-emote-ink ${uniformHeight ? 'line-clamp-2 text-sm' : 'text-emote-card-title'}`}
          >
            {entry.title || 'Untitled entry'}
          </h3>
        </div>

        <div
          className={`flex shrink-0 items-center sm:flex-col sm:items-end ${uniformHeight ? 'gap-1 sm:gap-1' : 'gap-1 sm:gap-2'}`}
        >
          {showHistoryButton ? (
            <button
              type="button"
              onClick={openHistory}
              className={`rounded-lg font-semibold text-emote-accent-2 transition hover:bg-emote-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emote-accent/50 ${uniformHeight ? 'px-2 py-1 text-[11px] sm:text-xs' : 'px-3 py-1.5 text-emote-caption'}`}
            >
              History
            </button>
          ) : null}
          <div className="flex gap-0.5 sm:gap-1">
            {showEditButton ? (
              <button
                type="button"
                onClick={handleEdit}
                className={`rounded-lg text-emote-ink-faint transition hover:bg-emote-accent/10 hover:text-emote-accent-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emote-accent/40 ${uniformHeight ? 'p-1.5' : 'p-2'}`}
                aria-label="Edit entry"
              >
                <PencilIcon />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className={`rounded-lg text-emote-ink-faint transition hover:bg-rose-800/10 hover:text-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-800/40 ${uniformHeight ? 'p-1.5' : 'p-2'}`}
                aria-label="Delete entry"
              >
                <TrashIcon />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <p className={bodyClass}>{entry.content}</p>

      {hasTags && (
        <div className={tagsWrapClass}>
          {entry.emotions?.map((emotion, index) => (
            <span key={`emo-${index}`} className={`${chipClass} bg-emote-gold/15 text-emote-ink ring-emote-gold/40`}>
              {emotion}
            </span>
          ))}
          {entry.themes?.map((theme, index) => (
            <button
              type="button"
              key={`theme-${index}`}
              onClick={() => onThemeClick && onThemeClick(theme)}
              className={`${chipClass} bg-emote-accent-2/10 text-emote-ink ring-emote-accent-2/30 transition hover:bg-emote-accent-2/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emote-accent-2/40`}
            >
              {theme}
            </button>
          ))}
          {entry.activities?.map((actKey, index) => {
            const label = entry.activityLabels?.[actKey] || actKey;
            return (
              <span key={`act-${index}`} className={`${chipClass} bg-emote-accent/10 text-emote-ink ring-emote-accent/30`}>
                {label}
              </span>
            );
          })}
        </div>
      )}

      {showHistoryButton && historyOpen ? (
        <EntryHistoryModal entryId={entry.id} entryTitle={entry.title} onClose={() => setHistoryOpen(false)} />
      ) : null}

      {showEditButton && !onEdit && editOpen ? (
        <EditEntryModal entry={entry} onClose={() => setEditOpen(false)} />
      ) : null}
    </article>
  );
};

export default JournalEntryCard;
