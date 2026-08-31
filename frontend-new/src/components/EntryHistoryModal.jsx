import React, { useEffect, useState } from 'react';
import { supabase, mapHistoryRow } from '../supabaseClient';
import { formatCreatedAt } from '../lib/entryDates';

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-emote-border bg-emote-surface shadow-emote shadow-emote-glow">
        <div className="flex items-start justify-between gap-4 border-b border-emote-border p-5">
          <div className="min-w-0">
            <h2 className="text-emote-card-title font-semibold text-emote-ink">Entry history</h2>
            <p className="mt-1 truncate text-emote-muted text-emote-ink-faint">{entryTitle || 'Untitled'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="emote-icon-btn h-9 w-9"
            aria-label="Close"
          >
            <span className="text-emote-page leading-none text-emote-ink-faint">&times;</span>
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading && <p className="text-center text-emote-muted text-emote-ink-faint">Loading history…</p>}
          {err && <p className="text-center text-emote-muted text-rose-800">{err}</p>}
          {!loading && !err && rows.length === 0 && (
            <p className="text-center text-emote-muted text-emote-ink-faint">No history yet for this entry.</p>
          )}
          {rows.map((h) => (
            <div
              key={h.id}
              className="space-y-3 rounded-xl border border-emote-border bg-emote-surface-alt/80 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-emote-muted">
                <span className="rounded-md bg-emote-accent/15 px-2 py-0.5 font-semibold text-emote-accent-2 ring-1 ring-emote-accent/30">
                  {eventLabel[h.eventType] || h.eventType}
                </span>
                <span className="text-emote-ink-faint">{formatCreatedAt(h)}</span>
              </div>
              {h.title ? <p className="font-medium text-emote-ink">{h.title}</p> : null}
              {h.content ? (
                <p className="line-clamp-6 whitespace-pre-wrap text-emote-muted leading-relaxed text-emote-ink-soft">{h.content}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {h.mood ? (
                  <span className="rounded-lg bg-emote-border/50 px-2 py-0.5 text-emote-caption font-medium text-emote-ink ring-1 ring-emote-border-strong">
                    Mood: {h.mood}
                  </span>
                ) : null}
                {h.sentimentScore != null && !Number.isNaN(h.sentimentScore) ? (
                  <span className="rounded-lg bg-emote-border/50 px-2 py-0.5 text-emote-caption font-medium text-emote-ink ring-1 ring-emote-border-strong">
                    Sentiment: {h.sentimentScore}
                  </span>
                ) : null}
              </div>
              {(h.emotions?.length > 0 || h.themes?.length > 0 || h.activities?.length > 0) && (
                <div className="flex flex-wrap gap-1.5 border-t border-emote-border pt-3">
                  {h.emotions?.map((e, i) => (
                    <span key={`e-${i}`} className="rounded-md bg-emote-gold/15 px-2 py-0.5 text-emote-caption text-emote-ink ring-1 ring-emote-gold/40">
                      {e}
                    </span>
                  ))}
                  {h.themes?.map((t, i) => (
                    <span key={`t-${i}`} className="rounded-md bg-emote-accent-2/10 px-2 py-0.5 text-emote-caption text-emote-ink ring-1 ring-emote-accent-2/30">
                      {t}
                    </span>
                  ))}
                  {h.activities?.map((a, i) => (
                    <span key={`a-${i}`} className="rounded-md bg-emote-accent/10 px-2 py-0.5 text-emote-caption text-emote-ink ring-1 ring-emote-accent/30">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EntryHistoryModal;
