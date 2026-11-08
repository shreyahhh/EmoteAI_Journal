import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { supabase, mapCycleDailyLogRow } from '../../../supabaseClient';
import { toLocalDateKey } from '../../../lib/entryDates';
import { cn } from '../../../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

const FLOW_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'spotting', label: 'Spotting' },
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
];
const PAIN_OPTIONS = [
  { id: 'mild', label: 'Mild' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'severe', label: 'Severe' },
];
const BODY_OPTIONS = [
  { id: 'cramps', label: 'Cramps' },
  { id: 'low_back', label: 'Low back' },
  { id: 'headache', label: 'Headache' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'tender_breasts', label: 'Tender breasts' },
  { id: 'acne', label: 'Acne' },
  { id: 'nausea', label: 'Nausea' },
];
const MOOD_OPTIONS = [
  { id: 'calm', label: 'Calm' },
  { id: 'irritable', label: 'Irritable' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'low', label: 'Low' },
  { id: 'confident', label: 'Confident' },
  { id: 'sensitive', label: 'Sensitive' },
];
const ENERGY_OPTIONS = [
  { id: 'low', label: 'Low' },
  { id: 'steady', label: 'Steady' },
  { id: 'high', label: 'High' },
  { id: 'tired', label: 'Tired' },
  { id: 'restless', label: 'Restless' },
  { id: 'slept_well', label: 'Slept well' },
];
const CRAVING_OPTIONS = [
  { id: 'cravings', label: 'Cravings' },
  { id: 'more_hungry', label: 'More hungry' },
  { id: 'less_hungry', label: 'Less hungry' },
  { id: 'upset_stomach', label: 'Upset stomach' },
];
const PRODUCT_OPTIONS = [
  { id: 'pad', label: 'Pad' },
  { id: 'tampon', label: 'Tampon' },
  { id: 'cup', label: 'Cup' },
  { id: 'period_underwear', label: 'Period underwear' },
  { id: 'disc', label: 'Disc' },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-emote-muted font-medium transition',
        active
          ? 'border-emote-accent/40 bg-emote-accent/15 text-emote-accent-2'
          : 'border-border bg-card text-secondary-foreground hover:border-emote-border-strong',
      )}
    >
      {children}
    </button>
  );
}

function ChipGroup({ label, hint, options, value, onToggle }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">{label}</span>
        {hint ? <span className="text-emote-caption text-emote-ink-faint">{hint}</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.id} active={value.includes(o.id)} onClick={() => onToggle(o.id)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

const emptyLog = { flow: null, pain: null, symptoms: [], mood: [], energy: [], cravings: [], products: [] };

/**
 * One day's cycle check-in (flow, pain, body, mood, energy, cravings,
 * products) — separate from the period start/end calendar below it. Backs
 * the reminder copy in useReminderScheduler ("did your period start?" /
 * "how are you?").
 */
const TodayCheckIn = ({ user, logDate = toLocalDateKey(new Date()) }) => {
  const [log, setLog] = useState(emptyLog);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!supabase || !user?.id) {
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    supabase
      .from('cycle_daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', logDate)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const mapped = mapCycleDailyLogRow(data);
        setLog(mapped ? { ...emptyLog, ...mapped } : emptyLog);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, logDate]);

  const toggleMulti = (field, id) => {
    setSaved(false);
    setLog((prev) => ({
      ...prev,
      [field]: prev[field].includes(id) ? prev[field].filter((x) => x !== id) : [...prev[field], id],
    }));
  };

  const setSingle = (field, id) => {
    setSaved(false);
    setLog((prev) => ({ ...prev, [field]: prev[field] === id ? null : id }));
  };

  const handleSave = async () => {
    if (!supabase || !user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('cycle_daily_logs').upsert(
      {
        user_id: user.id,
        log_date: logDate,
        flow: log.flow,
        pain: log.pain,
        symptoms: log.symptoms,
        mood: log.mood,
        energy: log.energy,
        cravings: log.cravings,
        products: log.products,
      },
      { onConflict: 'user_id,log_date' },
    );
    setSaving(false);
    if (error) {
      console.error('Cycle check-in save:', error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Today's check-in</CardTitle>
          <span className="text-emote-caption text-emote-ink-faint">All optional</span>
        </div>
        <CardDescription>
          Saved next to today's journal entry, so Insights can show how your body and your writing move together.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChipGroup label="Flow" options={FLOW_OPTIONS} value={log.flow ? [log.flow] : []} onToggle={(id) => setSingle('flow', id)} />
        <ChipGroup label="Pain" options={PAIN_OPTIONS} value={log.pain ? [log.pain] : []} onToggle={(id) => setSingle('pain', id)} />
        <ChipGroup label="Body" options={BODY_OPTIONS} value={log.symptoms} onToggle={(id) => toggleMulti('symptoms', id)} />
        <ChipGroup label="Mood" options={MOOD_OPTIONS} value={log.mood} onToggle={(id) => toggleMulti('mood', id)} />
        <ChipGroup label="Energy & sleep" options={ENERGY_OPTIONS} value={log.energy} onToggle={(id) => toggleMulti('energy', id)} />
        <ChipGroup label="Cravings & digestion" options={CRAVING_OPTIONS} value={log.cravings} onToggle={(id) => toggleMulti('cravings', id)} />
        <ChipGroup label="Products used" hint="helps you plan" options={PRODUCT_OPTIONS} value={log.products} onToggle={(id) => toggleMulti('products', id)} />

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="button" variant={saved ? 'default' : 'gradient'} onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saved ? (
              <span className="flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4" /> Saved
              </span>
            ) : saving ? (
              'Saving…'
            ) : (
              "Save today's check-in"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayCheckIn;
