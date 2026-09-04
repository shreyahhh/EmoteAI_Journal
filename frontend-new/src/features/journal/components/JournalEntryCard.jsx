import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import EntryHistoryModal from './EntryHistoryModal';
import EditEntryModal from './EditEntryModal';
import { formatCreatedAt } from '../../../lib/entryDates';
import { MOOD_EMOJIS } from '../../../lib/moodMeta';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../components/ui/badge';
import EntryDetailModal from '../../../components/shared/EntryDetailModal';

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
  const tagChipCompact = 'rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset sm:text-xs';
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const openHistory = (e) => {
    e.stopPropagation();
    setHistoryOpen(true);
  };
  const handleEdit = (e) => {
    e.stopPropagation();
    (onEdit || (() => setEditOpen(true)))();
  };
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };
  const handleThemeClick = (e, theme) => {
    e.stopPropagation();
    onThemeClick && onThemeClick(theme);
  };

  const chipClass = uniformHeight ? tagChipCompact : tagChip;

  const articleLayout = uniformHeight
    ? 'flex h-full w-full min-h-[13rem] flex-col rounded-xl p-4 sm:min-h-[14rem]'
    : 'rounded-2xl p-6';

  const bodyClass = uniformHeight
    ? 'relative mt-2 min-h-0 flex-1 overflow-hidden text-sm leading-snug text-muted-foreground line-clamp-4'
    : 'relative mt-3 whitespace-pre-wrap text-emote-body leading-relaxed text-muted-foreground';

  const tagsWrapClass = uniformHeight
    ? 'relative mt-auto flex flex-wrap gap-1.5 border-t border-border pt-3'
    : 'relative mt-5 flex flex-wrap gap-2 border-t border-border pt-5';

  const hasTags = (entry.emotions?.length > 0 || entry.themes?.length > 0 || entry.activities?.length > 0) ?? false;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      role="button"
      tabIndex={0}
      onClick={() => setDetailOpen(true)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setDetailOpen(true);
        }
      }}
      className={cn(
        'group relative cursor-pointer overflow-hidden border border-border bg-card shadow-emote transition hover:border-emote-border-strong hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        articleLayout,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute rounded-full bg-gradient-to-br from-emote-accent-2/20 via-emote-accent/10 to-emote-gold/20 opacity-80 blur-2xl transition group-hover:opacity-100',
          uniformHeight ? '-right-10 -top-10 h-24 w-24' : '-right-16 -top-16 h-36 w-36',
        )}
      />

      <div
        className={cn(
          'relative flex shrink-0 flex-col sm:flex-row sm:items-start sm:justify-between',
          uniformHeight ? 'gap-2 sm:gap-2' : 'gap-4',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className={cn('flex flex-wrap items-center', uniformHeight ? 'mb-1 gap-1.5' : 'mb-2 gap-2')}>
            <time
              className={cn(
                'rounded-lg bg-emote-accent/10 font-semibold text-emote-accent-2 ring-1 ring-emote-accent/30',
                uniformHeight ? 'px-2 py-0.5 text-[11px] sm:text-xs' : 'px-2.5 py-1 text-emote-caption',
              )}
            >
              {formattedDate}
            </time>
            <span className={cn('leading-none', uniformHeight ? 'text-base' : 'text-emote-page')} title={entry.mood || 'neutral'}>
              {MOOD_EMOJIS[entry.mood] || MOOD_EMOJIS.neutral}
            </span>
          </div>
          <h3
            className={cn(
              'font-semibold tracking-tight text-foreground',
              uniformHeight ? 'line-clamp-2 text-sm' : 'text-emote-card-title',
            )}
          >
            {entry.title || 'Untitled entry'}
          </h3>
        </div>

        <div className={cn('flex shrink-0 items-center sm:flex-col sm:items-end', uniformHeight ? 'gap-1 sm:gap-1' : 'gap-1 sm:gap-2')}>
          {showHistoryButton ? (
            <button
              type="button"
              onClick={openHistory}
              className={cn(
                'rounded-lg font-semibold text-emote-accent-2 transition hover:bg-emote-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                uniformHeight ? 'px-2 py-1 text-[11px] sm:text-xs' : 'px-3 py-1.5 text-emote-caption',
              )}
            >
              History
            </button>
          ) : null}
          <div className="flex gap-0.5 sm:gap-1">
            {showEditButton ? (
              <button
                type="button"
                onClick={handleEdit}
                className={cn(
                  'rounded-lg text-emote-ink-faint transition hover:bg-emote-accent/10 hover:text-emote-accent-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  uniformHeight ? 'p-1.5' : 'p-2',
                )}
                aria-label="Edit entry"
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className={cn(
                  'rounded-lg text-emote-ink-faint transition hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40',
                  uniformHeight ? 'p-1.5' : 'p-2',
                )}
                aria-label="Delete entry"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <p className={bodyClass}>{entry.content}</p>

      {hasTags && (
        <div className={tagsWrapClass}>
          {entry.emotions?.map((emotion, index) => (
            <Badge key={`emo-${index}`} className={cn(chipClass, 'bg-emote-gold/15 text-foreground ring-emote-gold/40')}>
              {emotion}
            </Badge>
          ))}
          {entry.themes?.map((theme, index) => (
            <button
              type="button"
              key={`theme-${index}`}
              onClick={(e) => handleThemeClick(e, theme)}
              className={cn(
                chipClass,
                'bg-emote-accent-2/10 text-foreground ring-emote-accent-2/30 transition hover:bg-emote-accent-2/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emote-accent-2/40',
              )}
            >
              {theme}
            </button>
          ))}
          {entry.activities?.map((actKey, index) => {
            const label = entry.activityLabels?.[actKey] || actKey;
            return (
              <Badge key={`act-${index}`} className={cn(chipClass, 'bg-emote-accent/10 text-foreground ring-emote-accent/30')}>
                {label}
              </Badge>
            );
          })}
        </div>
      )}

      {/* React re-fires bubbled events through the component tree even across a
          Dialog's DOM portal, so clicks inside these modals would otherwise also
          trigger the card's own onClick (e.g. closing Edit would pop open the
          detail view) — stop that bubbling here. */}
      <div onClick={(e) => e.stopPropagation()}>
        {showHistoryButton && historyOpen ? (
          <EntryHistoryModal entryId={entry.id} entryTitle={entry.title} onClose={() => setHistoryOpen(false)} />
        ) : null}

        {showEditButton && !onEdit && editOpen ? <EditEntryModal entry={entry} onClose={() => setEditOpen(false)} /> : null}

        {detailOpen ? <EntryDetailModal entry={entry} onClose={() => setDetailOpen(false)} /> : null}
      </div>
    </motion.article>
  );
};

export default React.memo(JournalEntryCard);
