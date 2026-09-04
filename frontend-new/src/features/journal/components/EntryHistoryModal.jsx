import React, { useEffect, useState } from 'react';
import { supabase, mapHistoryRow } from '../../../supabaseClient';
import { formatCreatedAt } from '../../../lib/entryDates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';

const eventLabel = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
};

const EntryHistoryModal = ({ entryId, entryTitle, onClose }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase || !entryId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr('');
      const { data, error } = await supabase
        .from('journal_entry_history')
        .select('*')
        .eq('journal_entry_id', entryId)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        setRows((data || []).map(mapHistoryRow));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Entry history</DialogTitle>
          <DialogDescription className="truncate">{entryTitle || 'Untitled'}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto">
          {loading && <p className="text-center text-emote-muted text-emote-ink-faint">Loading history…</p>}
          {err && <p className="text-center text-emote-muted text-rose-800">{err}</p>}
          {!loading && !err && rows.length === 0 && (
            <p className="text-center text-emote-muted text-emote-ink-faint">No history yet for this entry.</p>
          )}
          {rows.map((h) => (
            <div key={h.id} className="space-y-3 rounded-xl border border-border bg-secondary/80 p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-emote-muted">
                <Badge className="bg-emote-accent/15 text-emote-accent-2 ring-emote-accent/30">
                  {eventLabel[h.eventType] || h.eventType}
                </Badge>
                <span className="text-emote-ink-faint">{formatCreatedAt(h)}</span>
              </div>
              {h.title ? <p className="font-medium text-foreground">{h.title}</p> : null}
              {h.content ? (
                <p className="line-clamp-6 whitespace-pre-wrap text-emote-muted leading-relaxed text-muted-foreground">{h.content}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {h.mood ? <Badge variant="secondary">Mood: {h.mood}</Badge> : null}
                {h.sentimentScore != null && !Number.isNaN(h.sentimentScore) ? (
                  <Badge variant="secondary">Sentiment: {h.sentimentScore}</Badge>
                ) : null}
              </div>
              {(h.emotions?.length > 0 || h.themes?.length > 0 || h.activities?.length > 0) && (
                <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {h.emotions?.map((e, i) => (
                    <Badge key={`e-${i}`} className="bg-emote-gold/15 text-foreground ring-emote-gold/40">
                      {e}
                    </Badge>
                  ))}
                  {h.themes?.map((t, i) => (
                    <Badge key={`t-${i}`} className="bg-emote-accent-2/10 text-foreground ring-emote-accent-2/30">
                      {t}
                    </Badge>
                  ))}
                  {h.activities?.map((a, i) => (
                    <Badge key={`a-${i}`} className="bg-emote-accent/10 text-foreground ring-emote-accent/30">
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntryHistoryModal;
