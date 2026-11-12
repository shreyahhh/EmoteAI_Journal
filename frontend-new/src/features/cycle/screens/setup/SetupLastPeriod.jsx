import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { toLocalDateKey } from '../../../../lib/models/entryDates';
import { formatRelativeDays } from '../../models/cycleCalculations';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import Chip from '../../components/Chip';

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

const SetupLastPeriod = ({ onBack, onContinue }) => {
  const todayKey = toLocalDateKey(new Date());
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [notSure, setNotSure] = useState(false);

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const pick = (key) => {
    setNotSure(false);
    setSelected(key);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="px-1 pb-8 pt-6 lg:mx-auto lg:max-w-[560px] lg:pt-10">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-none hover:bg-cycle-surface-2">
          <ArrowLeft className="h-4 w-4 text-cycle-text-2" />
        </button>
        <div className="flex-1">
          <p className="text-emote-caption text-cycle-faint">1 of 2</p>
          <div className="mt-1 h-1 rounded-none bg-cycle-line">
            <div className="h-full w-1/2 rounded-none bg-cycle-accent" />
          </div>
        </div>
      </div>

      <h1 className="mt-5 font-display text-emote-section text-cycle-text">When did your last period start?</h1>

      <div className="mt-5 rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-none hover:bg-cycle-surface"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-emote-body text-cycle-text">{monthLabel}</span>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-none hover:bg-cycle-surface"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-emote-caption text-cycle-faint">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((key, i) => {
            if (!key) return <div key={`p${i}`} />;
            const future = key > todayKey;
            const isSelected = key === selected;
            return (
              <button
                key={key}
                type="button"
                disabled={future}
                onClick={() => pick(key)}
                className={cn(
                  'flex aspect-square min-h-9 items-center justify-center rounded-full text-emote-muted',
                  isSelected ? 'bg-cycle-menstrual text-cycle-menstrual-ink' : future ? 'text-cycle-faint/40' : 'text-cycle-text-2 hover:bg-cycle-surface',
                )}
              >
                {Number(key.slice(-2))}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={selected === todayKey} onClick={() => pick(todayKey)}>
          It started today
        </Chip>
        <Chip active={notSure} onClick={() => { setNotSure(true); setSelected(null); }}>
          I&rsquo;m not sure
        </Chip>
      </div>

      {selected ? (
        <p className="mt-4 text-emote-muted text-cycle-text-2">
          Selected: {new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
          {' · '}
          {formatRelativeDays(selected, todayKey)}
        </p>
      ) : notSure ? (
        <p className="mt-4 text-emote-muted text-cycle-text-2">
          No problem — predictions start once you log your first period.
        </p>
      ) : null}

      <Button
        type="button"
        disabled={!selected && !notSure}
        onClick={() => onContinue({ lastPeriodDate: notSure ? null : selected })}
        className="mt-7 min-h-[54px] w-full rounded-none bg-cycle-accent text-cycle-accent-ink hover:brightness-110 disabled:opacity-40"
      >
        Continue
      </Button>
    </div>
  );
};

export default SetupLastPeriod;
