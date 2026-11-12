import React, { useEffect, useState } from 'react';
import { supabase, mapCycleSettingsRow } from '../../../supabaseClient';
import { cn } from '../../../lib/utils';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';

const DAYS_BEFORE_OPTIONS = [0, 1, 2, 3, 5, 7];

const Stepper = ({ label, value, onChange, min, max }) => (
  <div className="flex items-center justify-between rounded-none border border-emote-border bg-emote-surface-alt px-4 py-3">
    <span className="text-emote-muted text-emote-ink">{label}</span>
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-none border border-emote-border text-emote-ink-soft disabled:opacity-30"
      >
        −
      </button>
      <span className="w-6 text-center text-emote-muted font-semibold text-emote-ink">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-none border border-emote-border text-emote-ink-soft disabled:opacity-30"
      >
        +
      </button>
    </div>
  </div>
);

/**
 * Cycle's own settings, reached from Emote's main Settings modal — not a
 * separate screen inside Cycle (that was a deliberate call: one settings
 * entry point, not two). Self-contained: loads/saves cycle_settings itself.
 */
const CycleSettingsSection = ({ user }) => {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!supabase || !user?.id) return undefined;
    supabase
      .from('cycle_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setSettings(mapCycleSettingsRow(data));
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const save = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    await supabase.from('cycle_settings').upsert(
      {
        user_id: user.id,
        avg_cycle_length: next.avgCycleLength,
        avg_period_length: next.avgPeriodLength,
        irregular: next.irregular,
        enabled: next.enabled,
        period_reminder_enabled: next.periodReminderEnabled,
        period_reminder_days_before: next.periodReminderDaysBefore,
        daily_reminder_enabled: next.dailyReminderEnabled,
        daily_reminder_time: next.dailyReminderTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    setSaving(false);
  };

  const handleTurnOff = async () => {
    setWiping(true);
    await Promise.all([
      supabase.from('cycle_periods').delete().eq('user_id', user.id),
      supabase.from('cycle_daily_logs').delete().eq('user_id', user.id),
    ]);
    await save({ enabled: false, irregular: false, avgCycleLength: 28, avgPeriodLength: 5 });
    setWiping(false);
    setConfirmOpen(false);
    setMessage('Cycle data cleared. Opening Cycle again will start setup from scratch.');
    setTimeout(() => setMessage(''), 5000);
  };

  if (!settings) return null;

  return (
    <section>
      <h3 className="mb-3 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Cycle</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="Cycle length" value={settings.avgCycleLength} onChange={(v) => save({ avgCycleLength: v })} min={21} max={45} />
          <Stepper label="Period length" value={settings.avgPeriodLength} onChange={(v) => save({ avgPeriodLength: v })} min={2} max={10} />
        </div>

        <div className="flex items-center justify-between rounded-none border border-emote-border bg-emote-surface-alt p-4">
          <Label htmlFor="cycle-irregular" className="mb-0 text-emote-muted font-medium normal-case tracking-normal text-emote-ink">
            My cycle is irregular
          </Label>
          <Switch id="cycle-irregular" checked={settings.irregular} onCheckedChange={(v) => save({ irregular: v })} />
        </div>

        <div className="flex items-center justify-between rounded-none border border-emote-border bg-emote-surface-alt p-4">
          <Label htmlFor="cycle-period-reminder" className="mb-0 text-emote-muted font-medium normal-case tracking-normal text-emote-ink">
            Remind me before my period
          </Label>
          <Switch id="cycle-period-reminder" checked={settings.periodReminderEnabled} onCheckedChange={(v) => save({ periodReminderEnabled: v })} />
        </div>
        {settings.periodReminderEnabled ? (
          <div className="flex flex-wrap gap-2 pl-1">
            {DAYS_BEFORE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => save({ periodReminderDaysBefore: n })}
                className={cn(
                  'rounded-none border px-3 py-1.5 text-emote-caption font-semibold uppercase tracking-wider',
                  n === settings.periodReminderDaysBefore ? 'border-emote-accent bg-emote-accent/15 text-emote-accent' : 'border-emote-border text-emote-ink-soft',
                )}
              >
                {n === 0 ? 'Same day' : `${n}d before`}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between rounded-none border border-emote-border bg-emote-surface-alt p-4">
          <Label htmlFor="cycle-daily-reminder" className="mb-0 text-emote-muted font-medium normal-case tracking-normal text-emote-ink">
            Daily log reminder
          </Label>
          <Switch id="cycle-daily-reminder" checked={settings.dailyReminderEnabled} onCheckedChange={(v) => save({ dailyReminderEnabled: v })} />
        </div>
        {settings.dailyReminderEnabled ? (
          <input
            type="time"
            value={settings.dailyReminderTime}
            onChange={(e) => save({ dailyReminderTime: e.target.value })}
            className="rounded-none border border-emote-border bg-emote-surface-alt px-3.5 py-2 text-emote-muted text-emote-ink"
          />
        ) : null}

        {saving ? <p className="text-emote-caption text-emote-ink-faint">Saving…</p> : null}

        <div className="border-t border-emote-border pt-3">
          <button type="button" onClick={() => setConfirmOpen(true)} className="text-emote-muted font-medium text-rose-700 hover:underline">
            Turn Cycle off and delete all cycle data
          </button>
          {message ? <p className="mt-2 text-emote-caption text-emote-ink-faint">{message}</p> : null}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleTurnOff}
        title="Turn off Cycle?"
        message="This permanently deletes all your logged periods and daily check-ins. This can't be undone."
        confirmLabel={wiping ? 'Deleting…' : 'Turn off & delete'}
      />
    </section>
  );
};

export default CycleSettingsSection;
