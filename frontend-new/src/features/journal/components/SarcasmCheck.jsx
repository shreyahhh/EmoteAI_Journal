import React, { useMemo, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { pendingSarcasmLines, answerSarcasm } from '../../../lib/sarcasmFeedback';
import { normLine } from '../../../lib/sarcasmKeys';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

const SHARE_KEY = 'emote.sarcasm.shareForTraining';
const MAX_SHOWN = 3;

function readShare() {
  try {
    return window.localStorage.getItem(SHARE_KEY) === '1';
  } catch {
    return false;
  }
}

function Questions({ entry, lines, onAnswered }) {
  const [busyKey, setBusyKey] = useState(null); // one answer at a time, so they can't race each other
  const [error, setError] = useState('');
  const [share, setShare] = useState(readShare);

  const toggleShare = (checked) => {
    setShare(checked);
    try {
      window.localStorage.setItem(SHARE_KEY, checked ? '1' : '0');
    } catch {
      /* per-browser convenience only */
    }
  };

  const answer = async (line, value) => {
    const key = normLine(line.text);
    setBusyKey(key);
    setError('');
    try {
      await answerSarcasm({ supabase, entry, line, answer: value, shareForTraining: share });
      onAnswered(key);
    } catch (e) {
      console.error('Sarcasm answer failed:', e);
      setError(value === 'sarcastic' ? 'Could not update this entry right now. Try again in a moment.' : 'Could not save your answer. Try again.');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
      {lines.slice(0, MAX_SHOWN).map((line) => {
        const key = normLine(line.text);
        const busy = busyKey === key;
        const locked = busyKey !== null;
        const preview = line.ifSarcastic;
        return (
          <div key={key} className="rounded-xl border border-emote-gold/40 bg-emote-gold/10 p-3 text-emote-muted">
            <p className="text-foreground">
              Sounds sarcastic: <span className="font-medium">&ldquo;{line.text}&rdquo;</span>
            </p>
            <p className="mt-1 text-emote-ink-soft">
              Did you mean that negatively?
              {preview ? ` If yes, this line will read as ${preview.mood}.` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="gradient" disabled={locked} onClick={() => answer(line, 'sarcastic')} className="text-white">
                {busy ? 'Updating…' : 'Yes, sarcasm'}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={locked} onClick={() => answer(line, 'sincere')}>
                No, I meant it
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={locked} onClick={() => answer(line, 'skipped')} className="text-emote-ink-faint">
                Skip
              </Button>
            </div>
          </div>
        );
      })}
      {lines.length > MAX_SHOWN ? (
        <p className="text-emote-caption text-emote-ink-faint">{lines.length - MAX_SHOWN} more to check after these.</p>
      ) : null}
      <label className="flex cursor-pointer items-start gap-2 text-emote-caption text-emote-ink-faint">
        <input
          type="checkbox"
          checked={share}
          onChange={(e) => toggleShare(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-input"
        />
        <span>Let my answers help improve the sarcasm detector. Off by default; your entries stay private.</span>
      </label>
      {error ? <p className="emote-banner-warn">{error}</p> : null}
    </div>
  );
}

/**
 * Asks "did you mean that sarcastically?" for lines the model flagged as
 * sarcastic but that read positive. Nothing changes until she answers yes, so a
 * wrong flag never alters her mood data. Renders nothing when there's nothing
 * to ask. In compact cards it shows a small chip that opens the question.
 */
const SarcasmCheck = ({ entry, compact = false, className }) => {
  const [answeredKeys, setAnsweredKeys] = useState(() => new Set());
  const [open, setOpen] = useState(false);

  const lines = useMemo(
    () => pendingSarcasmLines(entry).filter((l) => !answeredKeys.has(normLine(l.text))),
    [entry, answeredKeys],
  );

  if (lines.length === 0) return null;

  const onAnswered = (key) => setAnsweredKeys((prev) => new Set(prev).add(key));

  if (compact) {
    return (
      <div className={className} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'mb-2 mt-2 rounded-md bg-emote-gold/20 px-1.5 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-inset ring-emote-gold/40 sm:text-xs',
            'transition hover:bg-emote-gold/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        >
          {lines.length} line{lines.length === 1 ? '' : 's'} to check for sarcasm
        </button>
        {open ? (
          <Dialog open onOpenChange={(o) => !o && setOpen(false)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Did you mean that sarcastically?</DialogTitle>
              </DialogHeader>
              <div className="mt-3">
                <Questions entry={entry} lines={lines} onAnswered={onAnswered} />
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('relative mt-4', className)}>
      <Questions entry={entry} lines={lines} onAnswered={onAnswered} />
    </div>
  );
};

export default SarcasmCheck;
