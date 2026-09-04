import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getCreatedAtDate } from '../../../lib/entryDates';
import EmptyState from '../../../components/shared/EmptyState';
import MoodBadge from '../../../components/shared/MoodBadge';
import EntryDetailModal from '../../../components/shared/EntryDetailModal';

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
      <EmptyState
        title="Your timeline is empty"
        description="Each saved entry gets a date; once you have a few, this view groups them by month with a simple vertical line."
      />
    );
  }

  return (
    <>
      {selectedEntry && <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}

      <div className="mx-auto max-w-4xl">
        <p className="mb-6 text-emote-muted leading-relaxed text-emote-ink-faint">
          Scroll the months on the left rail—click any row to open the full entry in a modal.
        </p>
        {Object.entries(entriesByMonth).map(([monthYear, monthEntries]) => (
          <div key={monthYear} className="relative border-l-2 border-emote-border-strong py-6 pl-8">
            <div className="absolute -left-[6px] top-9 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emote-accent-2 via-emote-accent to-emote-gold ring-4 ring-emote-surface" />
            <h2 className="emote-title-gradient mb-6 text-xl sm:text-2xl">{monthYear}</h2>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {monthEntries.map((entry) => (
                <TimelineEntryCard key={entry.id} entry={entry} onClick={() => setSelectedEntry(entry)} />
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </>
  );
};

const TimelineEntryCard = ({ entry, onClick }) => {
  const d = getCreatedAtDate(entry);
  const day = d ? d.getDate() : new Date().getDate();
  const displayMood = (entry.mood || (entry.emotions && entry.emotions[0]) || 'neutral').toLowerCase();

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
        <MoodBadge mood={displayMood} />
      </div>
    </button>
  );
};

export default TimelineView;
