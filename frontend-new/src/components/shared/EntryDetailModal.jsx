import React, { useMemo } from 'react';
import { getCreatedAtDate } from '../../lib/entryDates';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

/** Read-only "open a card to read the full entry" view — shared by Entries and Timeline. */
export default function EntryDetailModal({ entry, onClose }) {
  const formattedDate = useMemo(() => {
    const date = getCreatedAtDate(entry);
    if (!date) return null;
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' }).toUpperCase();
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }, [entry]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{entry.title || 'Untitled entry'}</DialogTitle>
          {formattedDate && <p className="mt-1 text-emote-muted text-emote-ink-faint">{formattedDate}</p>}
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <p className="whitespace-pre-wrap text-emote-body leading-relaxed text-emote-ink-soft">{entry.content}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
