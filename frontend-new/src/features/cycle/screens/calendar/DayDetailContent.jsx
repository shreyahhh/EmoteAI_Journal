import React, { useMemo, useState } from 'react';
import { getCreatedAtDate, toLocalDateKey } from '../../../../lib/models/entryDates';
import { moodValence } from '../../../../lib/models/moodBuckets';
import { getCycleDayAndPhase, getPhaseMeta } from '../../models/cycleCalculations';
import { Button } from '../../../../components/ui/button';
import LogSheetContent from '../today/LogSheetContent';

const LABELS = {
  none: 'None', spotting: 'Spotting', light: 'Light', medium: 'Medium', heavy: 'Heavy',
  mild: 'Mild', moderate: 'Moderate', severe: 'Severe',
  calm: 'Calm', sensitive: 'Sensitive', irritable: 'Irritable', anxious: 'Anxious', low: 'Low', energetic: 'Energetic',
  cramps: 'Cramps', bloating: 'Bloating', tender_breasts: 'Tender breasts', headache: 'Headache', back_pain: 'Back pain', acne: 'Acne',
  pad: 'Pad', tampon: 'Tampon', cup: 'Cup', period_underwear: 'Period underwear', disc: 'Disc',
};
const label = (id) => LABELS[id] || id;

const Row = ({ label: l, values }) => {
  if (!values || values.length === 0) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-cycle-line py-2.5 last:border-0">
      <span className="text-emote-muted text-cycle-faint">{l}</span>
      <span className="text-right text-emote-muted text-cycle-text">{values.map(label).join(', ')}</span>
    </div>
  );
};

/** 3.2 Day detail — shared by the mobile sheet and the desktop side panel. */
const DayDetailContent = ({ dateKey, data, entries, onClose }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => data.getLogFor(dateKey));
  const [saving, setSaving] = useState(false);

  const position = useMemo(() => getCycleDayAndPhase(dateKey, data.state.stats, data.todayKey), [dateKey, data.state.stats, data.todayKey]);
  const log = data.getLogFor(dateKey);
  const meta = position ? getPhaseMeta(position.phase) : null;

  const journalEntry = useMemo(() => {
    return (entries || []).find((e) => {
      const d = getCreatedAtDate(e);
      return d && toLocalDateKey(d) === dateKey;
    });
  }, [entries, dateKey]);

  const dateLabel = new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  if (editing) {
    return (
      <LogSheetContent
        log={draft}
        onChange={(field, value) => setDraft((prev) => ({ ...prev, [field]: value }))}
        onCancel={() => setEditing(false)}
        saving={saving}
        onSave={async () => {
          setSaving(true);
          await data.saveDailyLog(dateKey, draft);
          setSaving(false);
          setEditing(false);
        }}
      />
    );
  }

  const rows = [
    ['Flow', log.flow && log.flow !== 'none' ? [log.flow] : []],
    ['Pain', log.pain && log.pain !== 'none' ? [log.pain] : []],
    ['Mood', log.mood],
    ['Body', log.symptoms],
    ['Products', log.products],
  ];
  const anyLogged = rows.some(([, v]) => v.length > 0);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-emote-caption text-cycle-faint">{dateLabel}</p>
          {position ? (
            <p className="mt-0.5 font-display text-emote-section text-cycle-text">
              Cycle day {position.cycleDay} <span style={{ color: meta?.color }}>&middot; {meta?.label}</span>
            </p>
          ) : null}
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="min-h-11 px-2 text-emote-muted font-semibold uppercase tracking-wider text-cycle-faint lg:hidden">
            Close
          </button>
        ) : null}
      </div>

      <div className="mt-4 rounded-none border border-cycle-line bg-cycle-surface-2 px-4">
        {anyLogged ? (
          rows.map(([l, v]) => <Row key={l} label={l} values={v} />)
        ) : (
          <p className="py-3 text-emote-muted text-cycle-faint">Nothing logged this day.</p>
        )}
      </div>

      {journalEntry ? (
        <div className="mt-4 rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: moodValence(journalEntry) > 1.5 ? '#F0A35E' : moodValence(journalEntry) < -1.5 ? '#8FB3D9' : '#A8957D' }}
            />
            <p className="text-emote-caption uppercase tracking-wider text-cycle-faint">That night you wrote</p>
          </div>
          <p className="mt-1.5 font-display text-emote-body text-cycle-text">{journalEntry.title || 'Untitled entry'}</p>
          <p className="mt-1 line-clamp-2 font-serif text-emote-muted leading-relaxed text-cycle-text-2">{journalEntry.content}</p>
        </div>
      ) : null}

      <Button type="button" variant="outline" onClick={() => setEditing(true)} className="mt-4 min-h-[54px] w-full rounded-none border-cycle-line text-cycle-text">
        Edit
      </Button>
    </div>
  );
};

export default DayDetailContent;
