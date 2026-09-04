import React, { useMemo, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { getCreatedAtDate } from '../../../lib/entryDates';
import { moodValence } from '../../../lib/moodBuckets';
import { analyzeCyclePatterns, PMS_WINDOW_DAYS } from '../../../lib/cyclePattern';
import { cn } from '../../../lib/utils';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';

const SYMPTOM_OPTIONS = [
  { id: 'cramps', label: 'Cramps' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'headache', label: 'Headache' },
  { id: 'mood_swings', label: 'Mood swings' },
  { id: 'breast_tenderness', label: 'Breast tenderness' },
  { id: 'back_pain', label: 'Back pain' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'acne', label: 'Acne' },
  { id: 'sleep_issues', label: 'Sleep issues' },
  { id: 'food_cravings', label: 'Food cravings' },
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toDateKey(y, monthIndex, day) {
  return `${y}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function todayKey() {
  const t = new Date();
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
}

function cmpDateKey(a, b) {
  return a.localeCompare(b);
}

function entryDayKey(entry) {
  const d = getCreatedAtDate(entry);
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function dayInSavedPeriod(dayKey, periods) {
  const t = todayKey();
  return periods.some((p) => {
    const end = p.endDate || t;
    if (cmpDateKey(dayKey, p.startDate) < 0) return false;
    return cmpDateKey(dayKey, end) <= 0;
  });
}

function buildDuringOutsideChart(entries, periods) {
  const during = [];
  const outside = [];
  const t = todayKey();
  entries.forEach((e) => {
    const k = entryDayKey(e);
    if (!k) return;
    const v = moodValence(e);
    const onPeriod = periods.some((p) => {
      const end = p.endDate || t;
      if (cmpDateKey(k, p.startDate) < 0) return false;
      return cmpDateKey(k, end) <= 0;
    });
    if (onPeriod) during.push(v);
    else outside.push(v);
  });
  const avg = (arr) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
  return [
    {
      name: 'On period days',
      avg: avg(during) ?? 0,
      avgReal: avg(during),
      n: during.length,
      fill: '#a8432f',
    },
    {
      name: 'Other days',
      avg: avg(outside) ?? 0,
      avgReal: avg(outside),
      n: outside.length,
      fill: '#a68a63',
    },
  ];
}

function buildMonthCells(viewYear, viewMonth) {
  const first = new Date(viewYear, viewMonth, 1);
  const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = first.getDay();
  const cells = [];
  for (let i = 0; i < startDow; i += 1) cells.push({ type: 'pad' });
  for (let d = 1; d <= dim; d += 1) {
    cells.push({ type: 'day', day: d, key: toDateKey(viewYear, viewMonth, d) });
  }
  while (cells.length % 7 !== 0) cells.push({ type: 'pad' });
  while (cells.length < 42) cells.push({ type: 'pad' });
  return cells;
}

function dayInPendingRange(dayKey, startKey, endKey, ongoingPick) {
  if (!startKey) return false;
  if (!endKey) {
    if (ongoingPick) return cmpDateKey(dayKey, startKey) >= 0 && cmpDateKey(dayKey, todayKey()) <= 0;
    return dayKey === startKey;
  }
  return cmpDateKey(dayKey, startKey) >= 0 && cmpDateKey(dayKey, endKey) <= 0;
}

const CycleView = ({ user, entries, cyclePeriods, onPeriodsUpdated }) => {
  const chartMuted = '#7a5c3e';
  const chartGrid = '#e0c9a0';
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [calendarMode, setCalendarMode] = useState(false);
  const [pendingStart, setPendingStart] = useState(null);
  const [pendingEnd, setPendingEnd] = useState(null);
  const [ongoing, setOngoing] = useState(false);
  const [moodReflection, setMoodReflection] = useState('');
  const [notes, setNotes] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingDeletePeriodId, setPendingDeletePeriodId] = useState(null);

  const chartData = useMemo(() => buildDuringOutsideChart(entries, cyclePeriods), [entries, cyclePeriods]);
  const cycleAnalysis = useMemo(() => analyzeCyclePatterns(entries, cyclePeriods), [entries, cyclePeriods]);

  const monthCells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);

  const sortedPeriods = useMemo(
    () => [...cyclePeriods].sort((a, b) => String(b.startDate).localeCompare(String(a.startDate))),
    [cyclePeriods],
  );

  const resetForm = useCallback(() => {
    setPendingStart(null);
    setPendingEnd(null);
    setOngoing(false);
    setMoodReflection('');
    setNotes('');
    setSymptoms([]);
    setEditingId(null);
    setCalendarMode(false);
    setError('');
  }, []);

  const startNewFromCalendar = () => {
    resetForm();
    setCalendarMode(true);
  };

  const toggleSymptom = (id) => {
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDayClick = (key) => {
    if (!calendarMode && !editingId) return;
    if (!key) return;

    if (ongoing) {
      setPendingStart(key);
      setPendingEnd(null);
      return;
    }

    if (!pendingStart) {
      setPendingStart(key);
      setPendingEnd(null);
      return;
    }
    if (!pendingEnd) {
      if (cmpDateKey(key, pendingStart) < 0) {
        setPendingStart(key);
        setPendingEnd(null);
        return;
      }
      setPendingEnd(key);
      return;
    }
    setPendingStart(key);
    setPendingEnd(null);
  };

  const beginEdit = (p) => {
    setEditingId(p.id);
    setPendingStart(p.startDate);
    setPendingEnd(p.endDate || null);
    setOngoing(!p.endDate);
    setMoodReflection(p.moodReflection || '');
    setNotes(p.notes || '');
    setSymptoms([...(p.symptoms || [])]);
    setCalendarMode(true);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!supabase || !user?.id) return;
    if (!pendingStart) {
      setError('Choose a start day on the calendar.');
      return;
    }
    if (!ongoing && !pendingEnd) {
      setError('Choose an end day, or check “Still ongoing”.');
      return;
    }
    if (!ongoing && cmpDateKey(pendingEnd, pendingStart) < 0) {
      setError('End date must be on or after the start date.');
      return;
    }
    setSaving(true);
    setError('');
    const row = {
      user_id: user.id,
      start_date: pendingStart,
      end_date: ongoing ? null : pendingEnd,
      mood_reflection: moodReflection.trim(),
      notes: notes.trim(),
      symptoms,
      updated_at: new Date().toISOString(),
    };
    let upErr;
    if (editingId) {
      const res = await supabase.from('cycle_periods').update(row).eq('id', editingId).eq('user_id', user.id);
      upErr = res.error;
    } else {
      const res = await supabase.from('cycle_periods').insert({ ...row });
      upErr = res.error;
    }
    setSaving(false);
    if (upErr) {
      console.error(upErr);
      setError(
        upErr.message?.includes('relation') || upErr.code === '42P01'
          ? 'Run the latest Supabase migration (cycle_periods table), then try again.'
          : upErr.message || 'Could not save.',
      );
      return;
    }
    resetForm();
    onPeriodsUpdated?.();
  };

  const handleDelete = async (id) => {
    if (!supabase || !user?.id || !id) return;
    const { error: delErr } = await supabase.from('cycle_periods').delete().eq('id', id).eq('user_id', user.id);
    if (delErr) {
      console.error(delErr);
      return;
    }
    if (editingId === id) resetForm();
    onPeriodsUpdated?.();
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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

  const showForm = Boolean(
    editingId || (pendingStart && (ongoing || pendingEnd)),
  );

  return (
    <div className="space-y-8">
      <div className="emote-banner-info" role="note">
        <strong className="font-semibold text-emote-ink">Private.</strong>{' '}
        <span className="text-emote-ink/90">
          Period ranges stay on your account only. This is not medical advice—use it to notice your own patterns next
          to journal entries.
        </span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Calendar</CardTitle>
              <CardDescription className="mt-1.5">
                Mark when your period <span className="font-semibold text-foreground">started</span>, then when it{' '}
                <span className="font-semibold text-foreground">ended</span> (or say it&apos;s still ongoing). Past
                ranges show in soft color.
              </CardDescription>
            </div>
            <Button type="button" variant="gradient" onClick={startNewFromCalendar} className="shrink-0">
              New period on calendar
            </Button>
          </div>

          {calendarMode ? (
            <p className="mt-3 text-emote-muted text-emote-ink-soft">
              {ongoing
                ? 'Tap the day your period started. Then fill how you feel, symptoms, and notes — save when ready.'
                : pendingStart && !pendingEnd
                  ? 'Tap the last day of this period (on or after the start).'
                  : 'Tap the first day, then the last day of bleeding.'}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <Button type="button" variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-center text-emote-card-title font-semibold tracking-tight text-emote-ink">
              {monthLabel}
            </span>
            <Button type="button" variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mx-auto mt-3 w-full max-w-[18rem] sm:max-w-[20rem]">
            <div className="grid grid-cols-7 gap-0.5 text-center sm:gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div
                  key={d}
                  className="flex min-h-7 items-center justify-center py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-emote-ink-faint sm:text-emote-caption"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {monthCells.map((cell, idx) => {
                if (cell.type === 'pad')
                  return <div key={`p-${idx}`} className="min-h-8 sm:min-h-9" aria-hidden />;
                const { key } = cell;
                const inSaved = dayInSavedPeriod(key, cyclePeriods);
                const inPending = dayInPendingRange(key, pendingStart, pendingEnd, ongoing);
                const isStart = key === pendingStart;
                const isEnd = key === pendingEnd;
                const clickable = calendarMode || editingId;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!clickable}
                    onClick={() => handleDayClick(key)}
                    className={`flex aspect-square min-h-8 w-full min-w-0 items-center justify-center rounded-lg text-emote-muted font-semibold transition sm:min-h-9 sm:text-emote-body ${
                      inPending
                        ? 'bg-[#a8432f]/30 text-[#a8432f] ring-1 ring-[#a8432f]/60'
                        : inSaved
                          ? 'bg-[#a8432f]/10 text-[#a8432f] ring-1 ring-[#a8432f]/25'
                          : 'bg-emote-surface-alt text-emote-ink hover:bg-emote-border/40'
                    } ${!clickable ? 'cursor-default opacity-60' : 'active:scale-[0.98]'} ${isStart ? 'ring-2 ring-emote-gold ring-offset-1 ring-offset-emote-surface' : ''} ${isEnd && pendingEnd ? 'ring-2 ring-emote-accent ring-offset-1 ring-offset-emote-surface' : ''}`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          {calendarMode || editingId ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-emote-muted text-emote-ink-soft">
                <input
                  type="checkbox"
                  checked={ongoing}
                  onChange={(e) => setOngoing(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-[#a8432f] focus:ring-[#a8432f]/40"
                />
                Still ongoing (no end date yet)
              </label>
              <Button type="button" variant="ghost" onClick={resetForm} className="text-emote-muted">
                Cancel
              </Button>
            </div>
          ) : null}

          {error ? <p className="emote-banner-warn mt-4">{error}</p> : null}

          {showForm ? (
            <form onSubmit={handleSave} className="mt-6 space-y-5 border-t border-border pt-6">
              <p className="text-emote-muted text-emote-ink-soft">
                <span className="font-semibold text-emote-ink">Start:</span> {pendingStart}
                {ongoing ? (
                  <span className="ml-2 text-[#a8432f]">(ongoing)</span>
                ) : (
                  <>
                    <span className="mx-2">→</span>
                    <span className="font-semibold text-emote-ink">End:</span> {pendingEnd}
                  </>
                )}
              </p>

              <div>
                <p className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOM_OPTIONS.map((s) => (
                    <motion.button
                      key={s.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleSymptom(s.id)}
                      className={cn(
                        'rounded-full px-3.5 py-1.5 text-emote-muted font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                        symptoms.includes(s.id)
                          ? 'bg-gradient-to-r from-emote-accent-2/20 to-emote-gold/20 text-foreground ring-1 ring-emote-accent/30'
                          : 'border border-border bg-secondary text-secondary-foreground hover:border-emote-border-strong hover:bg-card',
                      )}
                    >
                      {s.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="cycle-mood">How do you feel?</Label>
                <Textarea
                  id="cycle-mood"
                  value={moodReflection}
                  onChange={(e) => setMoodReflection(e.target.value)}
                  rows={3}
                  className="min-h-[88px] resize-y"
                  placeholder="Energy, mood, anything you want to remember about this period…"
                />
              </div>

              <div>
                <Label htmlFor="cycle-notes">
                  Other notes <span className="font-normal normal-case text-emote-ink-faint">(optional)</span>
                </Label>
                <Textarea
                  id="cycle-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="min-h-[72px] resize-y"
                  placeholder="Anything else — sleep, meds, life context…"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Discard
                </Button>
                <Button type="submit" variant="gradient" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update period' : 'Save period'}
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Journal tone: period days vs other days</CardTitle>
          <CardDescription>
            Average sentiment (or estimated mood score) on days that fall inside a saved period vs all other days you
            journaled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cyclePeriods.length === 0 ? (
            <p className="text-center text-emote-muted text-emote-ink-faint">Save at least one period to see this chart.</p>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="name" stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} />
                  <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} domain={[-10, 10]} />
                  <Tooltip
                    formatter={(_, __, props) => {
                      const { n, avgReal } = props.payload;
                      if (!n) return ['No entries in this bucket', ''];
                      return [`${avgReal} (${n} entry${n === 1 ? '' : 's'})`, 'Avg'];
                    }}
                    contentStyle={{ borderRadius: '12px', border: `1px solid ${chartGrid}` }}
                  />
                  <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {cycleAnalysis ? (
        <Card>
          <CardHeader>
            <CardTitle>Mood by cycle phase</CardTitle>
            <CardDescription>
              {cycleAnalysis.stats.isEstimated
                ? `Phases estimated from your last ${cycleAnalysis.stats.cyclesObserved} logged cycles (avg ${cycleAnalysis.stats.cycleLengthDays}-day cycle). Not medical advice — a pattern to notice, not a diagnosis.`
                : `Using typical averages until you've logged two full cycles — phases will sharpen up after that. Not medical advice.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cycleAnalysis.phaseBreakdown.map((p) => ({ ...p, avgDisplay: p.avgSentiment ?? 0 }))}
                  margin={{ top: 8, right: 16, left: -8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="label" stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} />
                  <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} domain={[-10, 10]} />
                  <Tooltip
                    formatter={(_, __, props) => {
                      const { count, avgSentiment, topThemes } = props.payload;
                      if (!count) return ['No entries in this phase yet', ''];
                      const themes = topThemes?.length ? ` — ${topThemes.join(', ')}` : '';
                      return [`${avgSentiment} avg (${count} entries)${themes}`, 'Tone'];
                    }}
                    contentStyle={{ borderRadius: '12px', border: `1px solid ${chartGrid}` }}
                  />
                  <Bar dataKey="avgDisplay" radius={[8, 8, 0, 0]}>
                    {cycleAnalysis.phaseBreakdown.map((p) => (
                      <Cell key={p.id} fill={p.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              {cycleAnalysis.pmsPattern.detected ? (
                <div className="emote-banner-warn">
                  <p className="font-semibold text-emote-ink">Possible pre-menstrual pattern</p>
                  <p className="mt-1 text-emote-muted text-emote-ink/90">
                    The {PMS_WINDOW_DAYS} days before your period average {cycleAnalysis.pmsPattern.avgPreMenstrual}, vs{' '}
                    {cycleAnalysis.pmsPattern.avgRestOfCycle} the rest of your cycle — based on{' '}
                    {cycleAnalysis.pmsPattern.sampleSize} entries in that window. Worth keeping an eye on, not a diagnosis.
                  </p>
                </div>
              ) : cycleAnalysis.pmsPattern.reason === 'not-enough-data' ? (
                <p className="text-emote-muted text-emote-ink-faint">
                  Not enough entries in the days right before your period yet to check for a pre-menstrual pattern —
                  keep journaling through a cycle or two.
                </p>
              ) : (
                <p className="text-emote-muted text-emote-ink-faint">
                  No notable dip in the days before your period so far, based on {cycleAnalysis.pmsPattern.sampleSize}{' '}
                  entries in that window.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Saved periods</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPeriods.length === 0 ? (
            <p className="text-emote-muted text-emote-ink-faint">None yet — use &quot;New period on calendar&quot; above.</p>
          ) : (
            <ul className="divide-y divide-border">
              {sortedPeriods.map((p) => (
                <li key={p.id} className="py-4 first:pt-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-emote-ink">
                        {p.startDate}
                        {p.endDate ? ` → ${p.endDate}` : ' → ongoing'}
                      </p>
                      {(p.symptoms || []).length > 0 ? (
                        <p className="mt-1 text-emote-caption text-emote-ink-soft">
                          {(p.symptoms || []).map((id) => SYMPTOM_OPTIONS.find((o) => o.id === id)?.label || id).join(' · ')}
                        </p>
                      ) : null}
                      {p.moodReflection ? (
                        <p className="mt-2 text-emote-muted leading-relaxed text-emote-ink-soft">{p.moodReflection}</p>
                      ) : null}
                      {p.notes ? <p className="mt-1 text-emote-caption text-emote-ink-faint">{p.notes}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => beginEdit(p)} className="text-emote-muted">
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setPendingDeletePeriodId(p.id)}
                        className="text-emote-muted"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(pendingDeletePeriodId)}
        onClose={() => setPendingDeletePeriodId(null)}
        onConfirm={() => {
          handleDelete(pendingDeletePeriodId);
          setPendingDeletePeriodId(null);
        }}
        title="Delete this period?"
        message="This removes the saved period permanently. This can't be undone."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default CycleView;
