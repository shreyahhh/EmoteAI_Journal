import React, { useState, useEffect, useMemo } from 'react';
import { supabase, mapGoalRow } from '../supabaseClient';
import { matchTagsFuzzy } from '../lib/themeMatch';

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

  const loadGoals = React.useCallback(async () => {
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
    if (!supabase || !window.confirm('Delete this goal?')) return;
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
      <div className="emote-panel">
        <h3 className="emote-title-gradient text-emote-section">Your active goals</h3>
        <p className="mb-4 mt-1.5 text-emote-muted leading-relaxed text-emote-ink-soft">
          Check the circle to mark today done—great for small daily habits you want to notice.
        </p>
        {error ? <p className="emote-banner-warn mb-4">{error}</p> : null}
        {isLoading ? (
          <p className="text-emote-muted text-emote-ink-soft">Loading goals…</p>
        ) : goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onToggleCompletion={handleToggleCompletion} onDelete={handleDeleteGoal} />
            ))}
          </div>
        ) : (
          <p className="text-emote-muted text-emote-ink-faint">Add a goal below.</p>
        )}
      </div>
      <NewGoalForm onAddGoal={handleAddGoal} />
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
    <div className="emote-panel">
      <h3 className="emote-title-gradient mb-4 text-emote-section">Suggestions</h3>
      <div className="space-y-3">
        {suggestedGoals.map((suggestion, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl border border-emote-border bg-emote-surface-alt/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="flex-1 text-emote-body leading-relaxed text-emote-ink">{suggestion}</p>
            <button type="button" onClick={() => onAddGoal(suggestion)} className="emote-btn-primary shrink-0 py-2 px-4">Add goal</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const GoalCard = ({ goal, onToggleCompletion, onDelete }) => {
  const today = todayKey();
  const isCompletedToday = goal.completions && goal.completions[today];

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-all duration-300 ${isCompletedToday ? 'border-[#3f8f5f]/30 bg-[#3f8f5f]/10 border-l-4 border-l-[#3f8f5f]' : 'border-emote-border bg-emote-surface shadow-sm border-l-4 border-l-emote-accent'}`}>
      <p className={`min-w-0 flex-1 text-emote-card-title ${isCompletedToday ? 'text-emote-ink-faint line-through' : 'text-emote-ink'}`}>{goal.title}</p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => onToggleCompletion(goal.id, today)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-105 ${isCompletedToday ? 'border-[#3f8f5f] bg-[#3f8f5f] text-emote-surface' : 'border-emote-border-strong bg-emote-surface hover:border-[#3f8f5f]/60 hover:bg-[#3f8f5f]/10'}`}
          title="Mark as complete for today"
        >
          {isCompletedToday && <span className="text-emote-card-title">✓</span>}
        </button>
        <button
          onClick={() => onDelete(goal.id)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-emote-ink-faint transition hover:bg-rose-800/10 hover:text-rose-800"
          title="Delete goal"
          aria-label="Delete goal"
        >
          ×
        </button>
      </div>
    </div>
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
    <div className="emote-panel">
      <h3 className="emote-title-gradient text-emote-section">New goal</h3>
      <p className="mb-4 mt-1.5 text-emote-muted leading-relaxed text-emote-ink-soft">
        Phrase it as something you can repeat—short lines work best on the list.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Meditate for 10 minutes"
          className="emote-input flex-1"
        />
        <button type="submit" className="emote-btn-primary shrink-0 sm:px-8">Add goal</button>
      </form>
    </div>
  );
};

export default GoalsView;
