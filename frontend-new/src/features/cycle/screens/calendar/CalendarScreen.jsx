import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toLocalDateKey, getCreatedAtDate } from '../../../../lib/models/entryDates';
import { formatRelativeDays, addDays } from '../../models/cycleCalculations';
import { cn } from '../../../../lib/utils';
import { BottomSheet } from '../../../../components/ui/sheet';
import DayDetailContent from './DayDetailContent';

function pad2(n) {
  return String(n).padStart(2, '0');
}
function buildMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const dim = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i += 1) cells.push(null);
  for (let d = 1; d <= dim; d += 1) cells.push(`${year}-${pad2(month + 1)}-${pad2(d)}`);
  return cells;
}
function inRange(key, start, end) {
  return start && end && key >= start && key <= end;
}
const FLOW_OPACITY = { spotting: 0.3, light: 0.5, medium: 0.75, heavy: 1 };

const LEGEND = [
  { label: 'Period', swatch: <span className="h-2.5 w-2.5 rounded-full bg-cycle-menstrual" /> },
  { label: 'Expected', swatch: <span className="h-2.5 w-2.5 rounded-full border border-dashed border-cycle-menstrual" /> },
  { label: 'Ovulation (est.)', swatch: <span className="h-2 w-2 rounded-full bg-cycle-ovulatory" /> },
  { label: 'Journal tone', swatch: <span className="h-1.5 w-1.5 rounded-full bg-cycle-text-2" /> },
];

const CalendarScreen = ({ entries, data, isDesktop }) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState(null);
  const [detailKey, setDetailKey] = useState(null);

  const { periods, todayKey, state, getLogFor } = data;
  const predictions = state.predictions;

  const entryDateKeys = useMemo(() => {
    const set = new Set();
    (entries || []).forEach((e) => {
      const d = getCreatedAtDate(e);
      if (d) set.add(toLocalDateKey(d));
    });
    return set;
  }, [entries]);

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const dayMeta = (key) => {
    const loggedPeriod = periods.find((p) => inRange(key, p.startDate, p.endDate || (p === periods[periods.length - 1] ? todayKey : p.startDate)));
    let isExpected = false;
    if (predictions && !loggedPeriod) {
      if (predictions.isIrregular && predictions.nextPeriodRange) {
        isExpected = inRange(key, predictions.nextPeriodRange.startKey, addDays(predictions.nextPeriodRange.endKey, predictions.avgPeriodLength - 1));
      } else {
        isExpected = inRange(key, predictions.nextPeriodStartKey, addDays(predictions.nextPeriodStartKey, predictions.avgPeriodLength - 1));
      }
    }
    const isOvulation = predictions?.ovulationDateKey === key;
    const isFertile = predictions?.fertileWindow && inRange(key, predictions.fertileWindow.startKey, predictions.fertileWindow.endKey);
    const flow = loggedPeriod ? getLogFor(key).flow : null;
    return { loggedPeriod, isExpected, isOvulation, isFertile, hasEntry: entryDateKeys.has(key), flow };
  };

  const handleDayClick = (key) => {
    if (key > todayKey) {
      setSelectedKey(key);
      setDetailKey(null);
    } else {
      setDetailKey(key);
      setSelectedKey(null);
    }
  };

  const selectedCard = selectedKey ? buildSelectedCopy(selectedKey, todayKey, predictions) : null;

  const grid = (
    <div className={cn('rounded-none border border-cycle-line bg-cycle-surface-2 p-4', isDesktop && 'p-5')}>
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-none hover:bg-cycle-surface">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-display text-emote-card-title text-cycle-text">{monthLabel}</span>
        <button type="button" onClick={nextMonth} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-none hover:bg-cycle-surface">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className={cn('mt-3 grid grid-cols-7 gap-1 text-center text-emote-caption text-cycle-faint')}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className={cn('mt-1 grid grid-cols-7 gap-1.5')}>
        {cells.map((key, i) => {
          if (!key) return <div key={`p${i}`} />;
          const meta = dayMeta(key);
          const isToday = key === todayKey;
          const dayNum = Number(key.slice(-2));
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleDayClick(key)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-full text-emote-muted transition',
                isDesktop ? 'aspect-square min-h-14' : 'aspect-square min-h-9',
                meta.loggedPeriod
                  ? 'text-cycle-menstrual-ink'
                  : meta.isExpected
                    ? 'border border-dashed border-cycle-menstrual text-cycle-text-2'
                    : 'text-cycle-text-2 hover:bg-cycle-surface',
                isToday && !meta.loggedPeriod && 'ring-2 ring-cycle-accent',
              )}
              style={meta.loggedPeriod ? { backgroundColor: `rgba(217,144,154,${FLOW_OPACITY[meta.flow] ?? 0.6})` } : undefined}
            >
              {meta.isOvulation ? <span className="absolute top-0.5 h-1.5 w-1.5 rounded-full bg-cycle-ovulatory" aria-hidden /> : null}
              <span className={cn(isToday && !meta.loggedPeriod && 'font-semibold text-cycle-accent')}>{dayNum}</span>
              {meta.isFertile && !meta.isOvulation ? <span className="absolute bottom-0.5 h-0.5 w-2.5 rounded-full bg-cycle-ovulatory/60" aria-hidden /> : null}
              {meta.hasEntry ? <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-cycle-text-2" aria-hidden /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-cycle-line pt-3 text-emote-caption font-medium uppercase tracking-wider text-cycle-faint">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            {l.swatch} {l.label}
          </span>
        ))}
      </div>
    </div>
  );

  const detail = detailKey ? (
    <DayDetailContent
      dateKey={detailKey}
      data={data}
      entries={entries}
      onClose={() => setDetailKey(null)}
    />
  ) : null;

  if (isDesktop) {
    return (
      <div className="grid grid-cols-[1fr_360px] gap-6 px-8 pb-8">
        <div>
          {grid}
          {selectedCard ? <SelectedDayCard copy={selectedCard} /> : null}
        </div>
        <div className="rounded-none border border-cycle-line bg-cycle-surface-2 p-5">
          {detail || <p className="text-emote-muted text-cycle-faint">Select a day to see its details.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="px-1">
      {grid}
      {selectedCard ? <SelectedDayCard copy={selectedCard} /> : null}
      <BottomSheet open={Boolean(detailKey)} onOpenChange={(open) => !open && setDetailKey(null)}>
        {detail}
      </BottomSheet>
    </div>
  );
};

function buildSelectedCopy(key, todayKey, predictions) {
  if (!predictions) return null;
  const label = new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  if (key === predictions.nextPeriodStartKey || (predictions.nextPeriodRange && inRange(key, predictions.nextPeriodRange.startKey, predictions.nextPeriodRange.endKey))) {
    return {
      label,
      title: 'Period expected to start',
      detail: `Based on your last cycles · ${predictions.isIrregular ? 'less certain, your cycle varies' : 'usually within 2 days'}`,
    };
  }
  if (predictions.ovulationDateKey === key) {
    return { label, title: 'Estimated ovulation', detail: 'A rough estimate, not a fertility method.' };
  }
  return { label, title: formatRelativeDays(key, todayKey), detail: 'No prediction falls on this day.' };
}

const SelectedDayCard = ({ copy }) => (
  <div className="mt-4 rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
    <p className="text-emote-caption text-cycle-faint">{copy.label}</p>
    <p className="mt-0.5 font-display text-emote-card-title text-cycle-text">{copy.title}</p>
    <p className="mt-0.5 text-emote-muted text-cycle-faint">{copy.detail}</p>
  </div>
);

export default CalendarScreen;
