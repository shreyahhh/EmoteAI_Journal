import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import JournalEntryCard from '../../journal/components/JournalEntryCard';
import { getCreatedAtDate } from '../../../lib/entryDates';
import EmptyState from '../../../components/shared/EmptyState';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';

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

function filterEntries(entries, query, moodId, themeId, datePresetId) {
  let list = entries;
  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter((e) => (e.title || '').toLowerCase().includes(q) || (e.content || '').toLowerCase().includes(q));
  }
  if (moodId !== 'all') {
    list = list.filter((e) => (e.mood || 'neutral') === moodId);
  }
  if (themeId !== 'all') {
    list = list.filter((e) => (e.themes || []).includes(themeId));
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
  const [themeId, setThemeId] = useState('all');
  const [datePresetId, setDatePresetId] = useState('all');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const themeOptions = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => (e.themes || []).forEach((t) => set.add(t)));
    return [{ id: 'all', label: 'All themes' }, ...[...set].sort((a, b) => a.localeCompare(b)).map((t) => ({ id: t, label: t }))];
  }, [entries]);

  const filtered = useMemo(
    () => filterEntries(entries, query, moodId, themeId, datePresetId),
    [entries, query, moodId, themeId, datePresetId],
  );

  const hasActiveFilters = query.trim() !== '' || moodId !== 'all' || themeId !== 'all' || datePresetId !== 'all';

  const clearFilters = () => {
    setQuery('');
    setMoodId('all');
    setThemeId('all');
    setDatePresetId('all');
  };

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No entries yet"
        description="Go to Journal, write something, and save—your cards will show up here."
      />
    );
  }

  return (
    <>
      <p className="mb-5 text-emote-muted leading-relaxed text-emote-ink-faint">
        Open a card to read the full entry or jump to history. Newest posts appear at the top of the list.
      </p>

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5">
          <div className="min-w-0 flex-1">
            <Label htmlFor="entries-search">Search</Label>
            <Input
              id="entries-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title or body text…"
              autoComplete="off"
            />
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-3 lg:max-w-xl lg:flex-none lg:shrink-0">
            <div>
              <Label htmlFor="entries-mood">Mood</Label>
              <Select value={moodId} onValueChange={setMoodId}>
                <SelectTrigger id="entries-mood">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entries-theme">Theme</Label>
              <Select value={themeId} onValueChange={setThemeId}>
                <SelectTrigger id="entries-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entries-date">Date</Label>
              <Select value={datePresetId} onValueChange={setDatePresetId}>
                <SelectTrigger id="entries-date">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-emote-muted text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{' '}
            <span className="font-semibold text-foreground">{entries.length}</span>
          </p>
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" onClick={clearFilters} className="text-emote-muted">
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No matching entries" description="Try different search words, mood, or date range—or clear filters to see everything again.">
          <Button type="button" variant="gradient" onClick={clearFilters} className="mt-5">
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <motion.ul layout className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:items-stretch lg:gap-4">
          {filtered.map((entry) => (
            <li key={entry.id} className="h-full min-h-0">
              <JournalEntryCard
                entry={entry}
                onDelete={onDeleteEntry ? () => setPendingDeleteId(entry.id) : undefined}
                onThemeClick={setThemeId}
                showHistoryButton
                uniformHeight
              />
            </li>
          ))}
        </motion.ul>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteId)}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          onDeleteEntry(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        title="Delete this entry?"
        message="This removes the entry permanently. This can't be undone."
        confirmLabel="Delete"
      />
    </>
  );
};

export default EntriesView;
