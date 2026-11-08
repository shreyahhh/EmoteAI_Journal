import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, mapGoalRow } from '../../../supabaseClient';
import { matchTagsFuzzy } from '../../../lib/themeMatch';
import { computeStreak } from '../../../lib/streaks';
import { getCreatedAtDate } from '../../../lib/entryDates';
import { cn } from '../../../lib/utils';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';

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

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

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
            <div className="mt-5 rounded-2xl border border-border bg-emote-surface-alt p-4">
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
                'flex h-10 w-10 items-center justify-center rounded-full border-2',
                i < restNights.length ? 'border-[#8FB3D9] bg-[#8FB3D9]/20' : 'border-dashed border-border',
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
        <div className="grid grid-cols-5 gap-2">
          {MILESTONES.map((m) => {
            const reached = current >= m;
            return (
              <div
                key={m}
                className={cn(
                  'rounded-xl border px-2 py-3 text-center',
                  reached ? 'border-emote-accent bg-emote-accent/10' : 'border-border',
                )}
              >
                <p className={cn('text-emote-section font-semibold', reached ? 'text-emote-accent' : 'text-emote-ink')}>{m}</p>
                <p className="text-emote-caption text-emote-ink-faint">{reached ? 'reached' : 'nights'}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-emote-surface-alt">
          <div className="h-full rounded-full bg-emote-accent transition-all" style={{ width: `${progressPct}%` }} />
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

  const handleAddGoal = async (title) => {
    if (!supabase || !user?.id || !title.trim()) return;
    const { data, error: addErr } = await supabase
      .from('goals')
      .insert({ user_id: user.id, title: title.trim() })
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
        <h2 className="text-emote-page font-semibold text-emote-ink">Small habits</h2>
        <p className="mt-1 text-emote-muted text-emote-ink-faint">A short list of habits. Tap the circle when you&rsquo;ve done it today.</p>
      </div>

      <AIGoalSuggestions entries={entries} onAddGoal={handleAddGoal} />

      <Card>
        <CardHeader>
          <CardTitle>Your active habits</CardTitle>
          <CardDescription>
            Check the circle to mark today done—great for small daily habits you want to notice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="emote-banner-warn mb-4">{error}</p> : null}
          {isLoading ? (
            <p className="text-emote-muted text-emote-ink-soft">Loading habits…</p>
          ) : goals.length > 0 ? (
            <div className="space-y-3">
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
            <p className="text-emote-muted text-emote-ink-faint">Add a habit below.</p>
          )}
        </CardContent>
      </Card>

      <NewGoalForm onAddGoal={handleAddGoal} />

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggested from your journal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestedGoals.map((suggestion, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-dashed border-emote-border bg-emote-surface-alt/50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex-1 text-emote-body leading-relaxed text-emote-ink">{suggestion}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => onAddGoal(suggestion)} className="shrink-0">
                Add habit
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const GoalCard = ({ goal, onToggleCompletion, onDelete }) => {
  const today = todayKey();
  const isCompletedToday = goal.completions && goal.completions[today];

  return (
    <Card
      className={cn(
        'flex items-center justify-between gap-3 border-l-4 p-4 shadow-sm transition-all duration-300',
        isCompletedToday
          ? 'border-emote-accent/30 bg-emote-accent/10 border-l-emote-accent'
          : 'border-l-emote-accent',
      )}
    >
      <p className={cn('min-w-0 flex-1 text-emote-card-title', isCompletedToday ? 'text-emote-ink-faint line-through' : 'text-emote-ink')}>
        {goal.title}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => onToggleCompletion(goal.id, today)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-105',
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
          className="flex h-9 w-9 items-center justify-center rounded-full text-emote-ink-faint transition hover:bg-rose-800/10 hover:text-rose-800"
          title="Delete habit"
          aria-label="Delete habit"
        >
          ×
        </button>
      </div>
    </Card>
  );
};

const NewGoalForm = ({ onAddGoal }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddGoal(title);
    setTitle('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your own habit</CardTitle>
        <CardDescription>Phrase it as something you can repeat—short lines work best on the list.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Read for 10 minutes"
            className="flex-1"
          />
          <Button type="submit" variant="gradient" className="shrink-0 sm:px-8">
            Add habit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GoalsView;
