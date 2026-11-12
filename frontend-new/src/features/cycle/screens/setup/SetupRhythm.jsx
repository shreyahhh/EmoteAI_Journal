import React, { useState } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { addDays, formatRelativeDays } from '../../models/cycleCalculations';
import { toLocalDateKey } from '../../../../lib/models/entryDates';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';

const Stepper = ({ label, value, onChange, min, max }) => (
  <div className="rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
    <p className="text-emote-muted text-cycle-text-2">{label}</p>
    <div className="mt-2 flex items-center justify-between">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-11 w-11 items-center justify-center rounded-none border border-cycle-line text-cycle-text-2 disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="font-display text-emote-display text-cycle-text">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-11 w-11 items-center justify-center rounded-none border border-cycle-line text-cycle-text-2 disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
    <p className="mt-1 text-center text-emote-caption text-cycle-faint">{min}–{max} days</p>
  </div>
);

const SetupRhythm = ({ lastPeriodDate, onBack, onFinish }) => {
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [irregular, setIrregular] = useState(false);

  const anchor = lastPeriodDate || toLocalDateKey(new Date());
  const nextPeriodKey = addDays(anchor, cycleLength);

  return (
    <div className="px-1 pb-8 pt-6 lg:mx-auto lg:max-w-[560px] lg:pt-10">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-none hover:bg-cycle-surface-2">
          <ArrowLeft className="h-4 w-4 text-cycle-text-2" />
        </button>
        <div className="flex-1">
          <p className="text-emote-caption text-cycle-faint">2 of 2</p>
          <div className="mt-1 h-1 rounded-none bg-cycle-line">
            <div className="h-full w-full rounded-none bg-cycle-accent" />
          </div>
        </div>
      </div>

      <h1 className="mt-5 font-display text-emote-section text-cycle-text">Your rhythm</h1>
      <p className="mt-1 text-emote-muted text-cycle-faint">Rough numbers are fine — this improves as you log.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stepper label="Cycle length" value={cycleLength} onChange={setCycleLength} min={21} max={45} />
        <Stepper label="Period length" value={periodLength} onChange={setPeriodLength} min={2} max={10} />
      </div>

      <label className="mt-4 flex items-center justify-between rounded-none border border-cycle-line bg-cycle-surface-2 px-4 py-3.5">
        <span className="text-emote-muted text-cycle-text-2">My cycle is irregular</span>
        <Switch checked={irregular} onCheckedChange={setIrregular} />
      </label>

      <div className="mt-4 rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
        <p className="text-emote-caption uppercase tracking-wider text-cycle-faint">Your next period, roughly</p>
        <p className="mt-1 font-display text-emote-section text-cycle-text">
          {new Date(`${nextPeriodKey}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
          <span className="ml-2 text-emote-muted text-cycle-text-2">{formatRelativeDays(nextPeriodKey, toLocalDateKey(new Date()))}</span>
        </p>
      </div>

      <Button
        type="button"
        onClick={() => onFinish({ cycleLength, periodLength, irregular })}
        className="mt-7 min-h-[54px] w-full rounded-none bg-cycle-accent text-cycle-accent-ink hover:brightness-110"
      >
        Start tracking
      </Button>
    </div>
  );
};

export default SetupRhythm;
