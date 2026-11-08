import React, { useMemo, useState } from 'react';
import { Pencil, Trash2, History as HistoryIcon } from 'lucide-react';
import EntryHistoryModal from '../../journal/components/EntryHistoryModal';
import EditEntryModal from '../../journal/components/EditEntryModal';
import EntryDetailModal from '../../../components/shared/EntryDetailModal';
import { getCreatedAtDate } from '../../../lib/entryDates';
import { getMoodColor } from '../../../lib/moodMeta';
import EmptyState from '../../../components/shared/EmptyState';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { cn } from '../../../lib/utils';

const TONE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'lighter', label: 'Lighter' },
  { id: 'heavier', label: 'Heavier' },
];

const SORTS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
];

function matchesTone(entry, tone) {
  if (tone === 'all') return true;
  const score = typeof entry.sentimentScore === 'number' ? entry.sentimentScore : 0;
  return tone === 'lighter' ? score >= 0 : score < 0;
}

function monthKey(date) {
  return date ? `${date.getFullYear()}-${date.getMonth()}` : 'unknown';
}

function monthLabel(date) {
  return date ? date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Undated';
}

const EntriesView = ({ entries, onDeleteEntry, onNewEntry }) => {
  const [query, setQuery] = useState('');
  const [tone, setTone] = useState('all');
  const [feelingId, setFeelingId] = useState('all');
  const [tagId, setTagId] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState(() => new Set());
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [historyEntry, setHistoryEntry] = useState(null);
  const [detailEntry, setDetailEntry] = useState(null);

  const feelingOptions = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => (e.emotions || []).forEach((em) => set.add(em)));
    return [{ id: 'all', label: 'All feelings' }, ...[...set].sort((a, b) => a.localeCompare(b)).map((f) => ({ id: f, label: f }))];
  }, [entries]);

  const tagOptions = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => (e.themes || []).forEach((t) => set.add(t)));
    return [{ id: 'all', label: 'All tags' }, ...[...set].sort((a, b) => a.localeCompare(b)).map((t) => ({ id: t, label: t }))];
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = entries.filter((e) => {
      if (q && !(e.title || '').toLowerCase().includes(q) && !(e.content || '').toLowerCase().includes(q)) return false;
      if (!matchesTone(e, tone)) return false;
      if (feelingId !== 'all' && !(e.emotions || []).includes(feelingId)) return false;
      if (tagId !== 'all' && !(e.themes || []).includes(tagId)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const da = getCreatedAtDate(a)?.getTime() || 0;
      const db = getCreatedAtDate(b)?.getTime() || 0;
      return sort === 'newest' ? db - da : da - db;
    });
    return list;
  }, [entries, query, tone, feelingId, tagId, sort]);

  const hasActiveFilters = query.trim() !== '' || tone !== 'all' || feelingId !== 'all' || tagId !== 'all';

  const clearFilters = () => {
    setQuery('');
    setTone('all');
    setFeelingId('all');
    setTagId('all');
  };

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((entry) => {
      const d = getCreatedAtDate(entry);
      const key = monthKey(d);
      if (!map.has(key)) map.set(key, { label: monthLabel(d), entries: [] });
      map.get(key).entries.push(entry);
    });
    return [...map.values()];
  }, [filtered]);

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const confirmBulkDelete = async () => {
    const ids = [...selected];
    setBulkDeleteOpen(false);
    clearSelection();
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await onDeleteEntry(id);
    }
  };

  if (entries.length === 0) {
    return (
      <EmptyState title="No entries yet" description="Go to Journal, write something, and save—your cards will show up here." />
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
        {onNewEntry ? (
          <Button type="button" variant="gradient" onClick={onNewEntry}>
            New entry
          </Button>
        ) : null}
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-emote sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
          <div className="min-w-0 flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title or body text…"
              autoComplete="off"
              aria-label="Search entries"
            />
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border p-1">
            {TONE_FILTERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-emote-caption font-semibold transition',
                  tone === t.id ? 'bg-emote-surface-alt text-emote-ink' : 'text-emote-ink-soft hover:text-emote-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Select value={feelingId} onValueChange={setFeelingId}>
              <SelectTrigger aria-label="Feeling" className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feelingOptions.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger aria-label="Tag" className="sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tagOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger aria-label="Sort" className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-emote-muted text-emote-ink-faint">
            Showing <span className="font-semibold text-emote-ink">{filtered.length}</span> of{' '}
            <span className="font-semibold text-emote-ink">{entries.length}</span>
          </p>
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {selected.size > 0 ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emote-accent/30 bg-emote-accent/10 px-4 py-3">
          <p className="text-emote-muted font-medium text-emote-ink">{selected.size} selected</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={clearSelection}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
              Delete selected
            </Button>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title="No matching entries" description="Try different search words, feeling, or tag—or clear filters to see everything again.">
          <Button type="button" variant="gradient" onClick={clearFilters} className="mt-5">
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.label}>
              <div className="mb-2 flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-emote-section font-semibold text-emote-ink">{group.label}</h2>
                <span className="text-emote-muted text-emote-ink-faint">
                  {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              <ul className="list-none divide-y divide-border">
                {group.entries.map((entry) => {
                  const d = getCreatedAtDate(entry);
                  return (
                    <li key={entry.id} className="flex items-start gap-4 py-5">
                      <input
                        type="checkbox"
                        checked={selected.has(entry.id)}
                        onChange={() => toggleSelected(entry.id)}
                        aria-label={`Select ${entry.title || 'entry'}`}
                        className="mt-2 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-[rgb(var(--emote-accent))]"
                      />
                      <div className="w-12 shrink-0 text-center">
                        <p className="font-display text-emote-section leading-none text-emote-ink">
                          {d ? d.getDate() : '—'}
                        </p>
                        <p className="mt-1 text-emote-caption uppercase text-emote-ink-faint">
                          {d ? d.toLocaleDateString(undefined, { weekday: 'short' }) : ''}
                        </p>
                      </div>
                      <button type="button" onClick={() => setDetailEntry(entry)} className="min-w-0 flex-1 text-left">
                        <h3 className="flex items-center gap-2 font-semibold text-emote-ink">
                          <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: getMoodColor(entry.mood) }}
                            aria-hidden
                          />
                          {entry.title || 'Untitled entry'}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-emote-muted text-emote-ink-soft">{entry.content}</p>
                      </button>
                      <div className="hidden shrink-0 flex-wrap items-center gap-1.5 md:flex">
                        {(entry.themes || []).slice(0, 2).map((theme) => (
                          <span key={theme} className="rounded-full border border-border px-2.5 py-0.5 text-emote-caption text-emote-ink-soft">
                            {theme}
                          </span>
                        ))}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setHistoryEntry(entry)}
                          className="rounded-full p-2 text-emote-ink-faint transition hover:bg-accent hover:text-emote-ink"
                          aria-label="View history"
                          title="History"
                        >
                          <HistoryIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEntry(entry)}
                          className="rounded-full p-2 text-emote-ink-faint transition hover:bg-accent hover:text-emote-ink"
                          aria-label="Edit entry"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {onDeleteEntry ? (
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(entry.id)}
                            className="rounded-full p-2 text-emote-ink-faint transition hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {historyEntry ? (
        <EntryHistoryModal entryId={historyEntry.id} entryTitle={historyEntry.title} onClose={() => setHistoryEntry(null)} />
      ) : null}
      {editingEntry ? <EditEntryModal entry={editingEntry} onClose={() => setEditingEntry(null)} /> : null}
      {detailEntry ? <EntryDetailModal entry={detailEntry} onClose={() => setDetailEntry(null)} /> : null}

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

      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title={`Delete ${selected.size} ${selected.size === 1 ? 'entry' : 'entries'}?`}
        message="This removes the selected entries permanently. This can't be undone."
        confirmLabel="Delete"
      />
    </>
  );
};

export default EntriesView;
