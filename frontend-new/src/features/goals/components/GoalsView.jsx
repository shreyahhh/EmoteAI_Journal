import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, mapGoalRow } from '../../../supabaseClient';
import { matchTagsFuzzy } from '../../../lib/themeMatch';
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

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

const GoalsView = ({ entries, user }) => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDeleteGoalId, setPendingDeleteGoalId] = useState(null);

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
      <AIGoalSuggestions entries={entries} onAddGoal={handleAddGoal} />

      <Card>
        <CardHeader>
          <CardTitle>Your active goals</CardTitle>
          <CardDescription>
            Check the circle to mark today done—great for small daily habits you want to notice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="emote-banner-warn mb-4">{error}</p> : null}
          {isLoading ? (
            <p className="text-emote-muted text-emote-ink-soft">Loading goals…</p>
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
            <p className="text-emote-muted text-emote-ink-faint">Add a goal below.</p>
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
        title="Delete this goal?"
        message="This removes the goal permanently. This can't be undone."
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
        <CardTitle>Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestedGoals.map((suggestion, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-emote-border bg-emote-surface-alt/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex-1 text-emote-body leading-relaxed text-emote-ink">{suggestion}</p>
              <Button type="button" variant="gradient" size="sm" onClick={() => onAddGoal(suggestion)} className="shrink-0">
                Add goal
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
          ? 'border-[#3f8f5f]/30 bg-[#3f8f5f]/10 border-l-[#3f8f5f]'
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
              ? 'border-[#3f8f5f] bg-[#3f8f5f] text-emote-surface'
              : 'border-emote-border-strong bg-emote-surface hover:border-[#3f8f5f]/60 hover:bg-[#3f8f5f]/10',
          )}
          title="Mark as complete for today"
        >
          {isCompletedToday && <span className="text-emote-card-title">✓</span>}
        </button>
        <button
          onClick={onDelete}
          className="flex h-9 w-9 items-center justify-center rounded-full text-emote-ink-faint transition hover:bg-rose-800/10 hover:text-rose-800"
          title="Delete goal"
          aria-label="Delete goal"
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
        <CardTitle>New goal</CardTitle>
        <CardDescription>Phrase it as something you can repeat—short lines work best on the list.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Meditate for 10 minutes"
            className="flex-1"
          />
          <Button type="submit" variant="gradient" className="shrink-0 sm:px-8">
            Add goal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GoalsView;
