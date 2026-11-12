import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, mapGoalRow } from '../../../supabaseClient';
import { matchTagsFuzzy } from '../models/goalsThemeMatch';
import { computeStreak } from '../../../lib/models/streaks';
import { getCreatedAtDate } from '../../../lib/models/entryDates';
import { cn } from '../../../lib/utils';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { PLANETS } from '../../galaxy/models/galaxyPlanetsConfig';

const GOAL_SUGGESTIONS_MAP = {
  anxiety: 'Practice a 5-minute breathing exercise daily.',
  stress: 'Take a 10-minute break away from screens each afternoon.',
  'self-doubt': 'Write down one personal accomplishment at the end of each day.',
  insecurity: 'Write down one personal accomplishment at the end of each day.',
  loneliness: 'Reach out to one friend or family member this week.',
  'low mood': 'Spend 15 minutes outside in the sun each day.',
  sadness: 'Spend 15 minutes outside in the sun each day.',
};

const MILESTONES = [7, 14, 30, 60, 100];
const REST_NIGHTS_PER_MONTH = 2;
const DEFAULT_TARGET_PER_WEEK = 3;
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Mon–Sun date keys (same `toISOString` convention as `todayKey`) for the week containing `now`. */
function currentWeekKeys(now = new Date()) {
  const dow = now.getDay(); // 0 = Sun .. 6 = Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(now, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i).toISOString().split('T')[0]);
}

const ProgressRing = ({ progress, size = 56, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="stroke-emote-surface-alt" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="stroke-emote-accent transition-all duration-500"
      />
    </svg>
  );
};

function restNightsStorageKey() {
  const now = new Date();
  return `emote-rest-nights-${now.getFullYear()}-${now.getMonth()}`;
}

function loadRestNightsUsed() {
  try {
    return JSON.parse(window.localStorage.getItem(restNightsStorageKey()) || '[]');
  } catch {
    return [];
  }
}

const StreakHero = ({ entries, onWriteTonight }) => {
  const { current, longest, activeToday } = useMemo(() => computeStreak(entries), [entries]);
  const [restNights, setRestNights] = useState(loadRestNightsUsed);

  const last14 = useMemo(() => {
    const written = new Set();
    entries.forEach((e) => {
      const d = getCreatedAtDate(e);
      if (d) written.add(d.toDateString());
    });
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (13 - i));
      const key = d.toDateString();
      return {
        label: d.getDate(),
        wrote: written.has(key),
        rest: restNights.includes(key),
        isToday: i === 13,
      };
    });
  }, [entries, restNights]);

  const takeRestNight = () => {
    if (restNights.length >= REST_NIGHTS_PER_MONTH) return;
    const key = new Date().toDateString();
    if (restNights.includes(key)) return;
    const next = [...restNights, key];
    setRestNights(next);
    try {
      window.localStorage.setItem(restNightsStorageKey(), JSON.stringify(next));
    } catch {
      /* best-effort only */
    }
  };

  const entriesThisYear = useMemo(
    () => entries.filter((e) => getCreatedAtDate(e)?.getFullYear() === new Date().getFullYear()).length,
    [entries],
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:gap-10 md:p-8">
        <div>
          <p className="text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">Writing streak</p>
          <p className="font-display mt-2 text-6xl leading-none text-emote-ink">
            {current}
          </p>
          <p className="mt-1 text-emote-section text-emote-ink-soft">nights in a row</p>
          <p className="mt-3 text-emote-muted text-emote-ink-faint">
            Longest: {longest} night{longest === 1 ? '' : 's'} &middot; {entriesThisYear} entries this year
          </p>

          {!activeToday ? (
            <div className="mt-5 rounded-none border border-border bg-emote-surface-alt p-4">
              <p className="text-emote-muted text-emote-ink-soft">
                Tonight isn&rsquo;t written yet. {current > 0 ? `You have until midnight to keep your ${current}-night streak going.` : 'Start tonight.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="gradient" onClick={onWriteTonight}>
                  Write tonight&rsquo;s entry
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={takeRestNight}
                  disabled={restNights.length >= REST_NIGHTS_PER_MONTH || restNights.includes(new Date().toDateString())}
                >
                  Take a rest night
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-emote-card-title font-semibold text-emote-ink">Your last two weeks</h3>
            <span className="text-emote-caption text-emote-ink-faint">Each night you write adds a star to the line</span>
          </div>
          <div className="mt-5 flex h-28 items-end gap-1.5">
            {last14.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
                <span
                  className={cn(
                    'h-2.5 w-2.5 shrink-0 rounded-full',
                    d.wrote ? 'bg-emote-accent' : d.rest ? 'border-2 border-emote-accent bg-transparent' : 'bg-emote-surface-alt',
                  )}
                  title={d.isToday ? 'Tonight' : undefined}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-emote-caption text-emote-ink-faint">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emote-accent" /> Wrote
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border-2 border-emote-accent" /> Rest night
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emote-surface-alt" /> Missed
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const RestNightsCard = () => {
  const [restNights] = useState(loadRestNightsUsed);
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rest nights</CardTitle>
          <span className="text-emote-caption text-emote-ink-faint">
            reset {resetDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {Array.from({ length: REST_NIGHTS_PER_MONTH }, (_, i) => (
            <span
              key={i}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-none border-2',
                i < restNights.length ? 'border-emote-cool bg-emote-cool/20' : 'border-dashed border-border',
              )}
            />
          ))}
        </div>
        <p className="mt-4 text-emote-muted text-emote-ink-faint">
          Life happens. Use a rest night and your streak carries on. You get two each month.
        </p>
      </CardContent>
    </Card>
  );
};

const MilestonesCard = ({ current }) => {
  const next = MILESTONES.find((m) => m > current) || MILESTONES[MILESTONES.length - 1];
  const prevMilestone = [0, ...MILESTONES].filter((m) => m <= current).pop() || 0;
  const span = next - prevMilestone || 1;
  const progressPct = Math.min(100, Math.max(0, ((current - prevMilestone) / span) * 100));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Milestones</CardTitle>
          <span className="text-emote-caption text-emote-ink-faint">
            {current >= MILESTONES[MILESTONES.length - 1] ? 'All reached' : `${next - current} nights to your ${next}-night star`}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {MILESTONES.map((m) => {
            const reached = current >= m;
            return (
              <div
                key={m}
                className={cn(
                  'rounded-none border px-2 py-3 text-center',
                  reached ? 'border-emote-accent bg-emote-accent/10' : 'border-border',
                )}
              >
                <p className={cn('text-emote-section font-semibold', reached ? 'text-emote-accent' : 'text-emote-ink')}>{m}</p>
                <p className="text-emote-caption text-emote-ink-faint">{reached ? 'reached' : 'nights'}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-none bg-emote-surface-alt">
          <div className="h-full rounded-none bg-emote-accent transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </CardContent>
    </Card>
  );
};

const GoalsView = ({ entries, user, onWriteTonight }) => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDeleteGoalId, setPendingDeleteGoalId] = useState(null);
  const { current: currentStreak } = useMemo(() => computeStreak(entries), [entries]);

  const loadGoals = useCallback(async () => {
    if (!supabase || !user?.id) {
      setGoals([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error: loadErr } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (loadErr) {
      console.error('Load goals error:', loadErr);
      setError(
        loadErr.code === '42P01'
          ? 'Run the latest Supabase migration (goals table), then try again.'
          : loadErr.message || 'Could not load goals.',
      );
      setGoals([]);
      setIsLoading(false);
      return;
    }
    setError('');
    setGoals((data || []).map(mapGoalRow));
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleAddGoal = async (title, targetPerWeek = DEFAULT_TARGET_PER_WEEK, planet = null) => {
    if (!supabase || !user?.id || !title.trim()) return;
    const { data, error: addErr } = await supabase
      .from('goals')
      .insert({ user_id: user.id, title: title.trim(), target_per_week: targetPerWeek, planet })
      .select()
      .single();
    if (addErr) {
      console.error('Add goal error:', addErr);
      setError(addErr.message || 'Could not add goal.');
      return;
    }
    setGoals((prev) => [...prev, mapGoalRow(data)]);
  };

  const handleToggleCompletion = async (goalId, date) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !supabase) return;
    const nextCompletions = { ...goal.completions };
    if (nextCompletions[date]) delete nextCompletions[date];
    else nextCompletions[date] = true;

    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, completions: nextCompletions } : g)));

    const { error: toggleErr } = await supabase
      .from('goals')
      .update({ completions: nextCompletions })
      .eq('id', goalId);
    if (toggleErr) {
      console.error('Toggle completion error:', toggleErr);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? goal : g)));
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!supabase) return;
    const prev = goals;
    setGoals((p) => p.filter((g) => g.id !== goalId));
    const { error: delErr } = await supabase.from('goals').delete().eq('id', goalId);
    if (delErr) {
      console.error('Delete goal error:', delErr);
      setGoals(prev);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <StreakHero entries={entries} onWriteTonight={onWriteTonight} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RestNightsCard />
        <MilestonesCard current={currentStreak} />
      </div>

      <div>
        <h2 className="text-emote-section font-semibold text-emote-ink">Small habits</h2>
        <p className="mt-1 text-emote-muted text-emote-ink-faint">A short list of habits. Tap the circle when you&rsquo;ve done it today.</p>
      </div>

      {error ? <p className="emote-banner-warn">{error}</p> : null}

      {isLoading ? (
        <p className="text-emote-muted text-emote-ink-soft">Loading habits…</p>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleCompletion={handleToggleCompletion}
              onDelete={() => setPendingDeleteGoalId(goal.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-none border border-dashed border-emote-border p-6">
          <h3 className="font-display text-emote-card-title text-emote-ink">No habits yet</h3>
          <p className="mt-2 max-w-xl text-emote-muted text-emote-ink-faint">
            Pick one small thing you&rsquo;d like to do a few times a week. Start with a suggestion from your journal
            below, or add your own.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AIGoalSuggestions entries={entries} onAddGoal={handleAddGoal} />
        <NewGoalForm onAddGoal={handleAddGoal} />
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteGoalId)}
        onClose={() => setPendingDeleteGoalId(null)}
        onConfirm={() => {
          handleDeleteGoal(pendingDeleteGoalId);
          setPendingDeleteGoalId(null);
        }}
        title="Delete this habit?"
        message="This removes the habit permanently. This can't be undone."
        confirmLabel="Delete"
      />
    </div>
  );
};

// --- AI-powered goal suggestions, based on recent entry themes ---
const AIGoalSuggestions = ({ entries, onAddGoal }) => {
  const suggestedGoals = useMemo(() => {
    const recentEntries = entries.slice(0, 5);
    if (recentEntries.length < 2) return [];
    const allThemes = recentEntries.flatMap((entry) => entry.themes || []);
    return matchTagsFuzzy(allThemes, GOAL_SUGGESTIONS_MAP);
  }, [entries]);

  if (suggestedGoals.length === 0) return null;

  return suggestedGoals.map((suggestion, index) => (
    <Card key={index} className="flex flex-col border-dashed">
      <CardHeader className="pb-3">
        <p className="text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">
          Suggested from your journal
        </p>
        <CardTitle className="text-emote-body">{suggestion}</CardTitle>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <Button type="button" variant="outline" size="sm" onClick={() => onAddGoal(suggestion)}>
          Add habit
        </Button>
      </CardContent>
    </Card>
  ));
};

const GoalCard = ({ goal, onToggleCompletion, onDelete }) => {
  const today = todayKey();
  const isCompletedToday = goal.completions && goal.completions[today];
  const target = goal.targetPerWeek || DEFAULT_TARGET_PER_WEEK;

  const weekKeys = useMemo(() => currentWeekKeys(), []);
  const todayIdx = weekKeys.indexOf(today);
  const doneCount = weekKeys.filter((k) => goal.completions?.[k]).length;
  const remaining = Math.max(0, target - doneCount);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-emote-card-title font-semibold text-emote-ink">{goal.title}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => onToggleCompletion(goal.id, today)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-none border-2 transition-all duration-300 hover:scale-105',
              isCompletedToday
                ? 'border-emote-accent bg-emote-accent text-emote-accent-ink'
                : 'border-emote-border-strong bg-emote-surface hover:border-emote-accent/60 hover:bg-emote-accent/10',
            )}
            title="Mark as complete for today"
          >
            {isCompletedToday && <span className="text-emote-card-title">✓</span>}
          </button>
          <button
            onClick={onDelete}
            className="flex h-10 w-10 items-center justify-center rounded-none text-emote-ink-faint transition hover:bg-destructive/10 hover:text-destructive"
            title="Delete habit"
            aria-label="Delete habit"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex shrink-0 items-center justify-center">
          <ProgressRing progress={target ? doneCount / target : 0} />
          <span className="absolute text-emote-card-title font-semibold text-emote-ink">{doneCount}</span>
        </div>
        <div>
          <p className="text-emote-muted text-emote-ink-soft">
            <span className="font-semibold text-emote-ink">{doneCount}</span> of {target} this week
          </p>
          <p className="text-emote-caption text-emote-ink-faint">
            {remaining > 0 ? `${remaining} more to reach your target` : 'Target reached this week'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5">
        {weekKeys.map((key, i) => {
          const done = Boolean(goal.completions?.[key]);
          const isToday = i === todayIdx;
          return (
            <span
              key={key}
              className="flex flex-col items-center gap-1"
              title={done ? 'Done' : isToday ? 'Today' : undefined}
            >
              <span
                className={cn(
                  'h-3 w-3 rounded-full border-2',
                  done
                    ? 'border-emote-accent bg-emote-accent'
                    : isToday
                      ? 'border-emote-accent bg-transparent'
                      : 'border-transparent bg-emote-surface-alt',
                )}
              />
              <span className="text-emote-caption text-emote-ink-faint">{WEEKDAY_LABELS[i]}</span>
            </span>
          );
        })}
      </div>
    </Card>
  );
};

const FREQUENCY_OPTIONS = [2, 3, 4, 5, 6, 7];

const NewGoalForm = ({ onAddGoal }) => {
  const [title, setTitle] = useState('');
  const [targetPerWeek, setTargetPerWeek] = useState(DEFAULT_TARGET_PER_WEEK);
  const [planet, setPlanet] = useState('none');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddGoal(title, targetPerWeek, planet === 'none' ? null : planet);
    setTitle('');
    setTargetPerWeek(DEFAULT_TARGET_PER_WEEK);
    setPlanet('none');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your own habit</CardTitle>
        <CardDescription>Phrase it as something you can repeat—short lines work best on the list.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Read for 10 minutes"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-emote-caption text-emote-ink-faint">times a week</span>
            {FREQUENCY_OPTIONS.map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setTargetPerWeek(n)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-none border text-emote-caption font-semibold transition',
                  n === targetPerWeek
                    ? 'border-emote-accent bg-emote-accent text-emote-accent-ink'
                    : 'border-border bg-card text-secondary-foreground hover:border-emote-border-strong',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emote-caption text-emote-ink-faint">Show as a moon around</span>
            <Select value={planet} onValueChange={setPlanet}>
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="No planet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No planet</SelectItem>
                {PLANETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="gradient" className="w-full sm:w-auto sm:px-8">
            Add &middot; {targetPerWeek} times a week
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GoalsView;
