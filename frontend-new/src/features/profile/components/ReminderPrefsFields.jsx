import React from 'react';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { cn } from '../../../lib/utils';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Evening-reminder editor: on/off switch, time, and day-of-week toggles.
 * Shared between first-run onboarding (ProfileSetupModal) and Settings so
 * both read/write the same profiles.reminder_* columns the same way.
 */
const ReminderPrefsFields = ({ enabled, onEnabledChange, time, onTimeChange, days, onDaysChange, idPrefix = 'reminder' }) => {
  const toggleDay = (dayIndex) => {
    onDaysChange(days.includes(dayIndex) ? days.filter((d) => d !== dayIndex) : [...days, dayIndex].sort());
  };

  return (
    <div className="rounded-xl border border-emote-border bg-emote-surface-alt p-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`${idPrefix}-toggle`} className="mb-0 text-emote-muted font-medium normal-case tracking-normal text-emote-ink">
          Evening reminder
        </Label>
        <Switch id={`${idPrefix}-toggle`} checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
      <div className={cn('mt-4 flex flex-wrap items-center gap-3', !enabled && 'pointer-events-none opacity-40')}>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${idPrefix}-time`} className="mb-0 normal-case tracking-normal text-emote-ink-soft">
            At
          </Label>
          <Input
            type="time"
            id={`${idPrefix}-time`}
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={!enabled}
            className="w-auto"
          />
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Reminder days">
          {DAY_LABELS.map((label, i) => {
            const active = days.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                aria-pressed={active}
                disabled={!enabled}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-emote-caption font-semibold transition',
                  active
                    ? 'bg-emote-accent text-[rgb(32_20_10)]'
                    : 'border border-emote-border text-emote-ink-faint hover:border-emote-border-strong',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReminderPrefsFields;
