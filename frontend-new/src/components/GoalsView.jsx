import React, { useState, useEffect, useMemo } from 'react';

const GoalsView = ({ entries, user }) => {
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // This would be a live listener to your 'goals' collection in Firestore
    useEffect(() => {
        // const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
        // const unsubscribe = onSnapshot(q, (querySnapshot) => {
        //     const userGoals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        //     setGoals(userGoals);
        //     setIsLoading(false);
        // });
        // return () => unsubscribe();
        
        // For demonstration purposes, we'll use mock data.
        const mockGoals = [
            { id: '1', title: 'Practice mindfulness for 5 minutes daily', completions: { '2025-07-20': true } },
            { id: '2', title: 'Write down one thing I\'m grateful for', completions: { '2025-07-19': true, '2025-07-18': true } },
            { id: '3', title: 'Go for a walk when feeling anxious', completions: {} },
        ];
        setGoals(mockGoals);
        setIsLoading(false);

    }, [user]);

    const handleAddGoal = async (title) => {
        setGoals(prev => [...prev, { id: Math.random().toString(), title, completions: {} }]);
    };

    const handleToggleCompletion = async (goalId, date) => {
        setGoals(goals.map(g => {
            if (g.id === goalId) {
                const newCompletions = { ...g.completions };
                if (newCompletions[date]) {
                    delete newCompletions[date];
                } else {
                    newCompletions[date] = true;
                }
                return { ...g, completions: newCompletions };
            }
            return g;
        }));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <AIGoalSuggestions entries={entries} onAddGoal={handleAddGoal} />
            <div className="emote-panel">
                <h3 className="emote-title-gradient text-emote-section">Your active goals</h3>
                <p className="mb-4 mt-1.5 text-emote-muted leading-relaxed text-slate-500">
                  Check the circle to mark today done—great for small daily habits you want to notice.
                </p>
                {isLoading ? (
                    <p className="text-emote-muted text-slate-600">Loading goals…</p>
                ) : goals.length > 0 ? (
                    <div className="space-y-3">
                        {goals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} onToggleCompletion={handleToggleCompletion} />
                        ))}
                    </div>
                ) : (
                    <p className="text-emote-muted text-slate-500">Add a goal below.</p>
                )}
            </div>
             <NewGoalForm onAddGoal={handleAddGoal} />
        </div>
    );
};

// --- New Component: AI-Powered Goal Suggestions ---
const AIGoalSuggestions = ({ entries, onAddGoal }) => {
    const suggestedGoals = useMemo(() => {
        const recentEntries = entries.slice(0, 5);
        if (recentEntries.length < 2) return [];

        const themeCounts = {};
        recentEntries.forEach(entry => {
            entry.themes?.forEach(theme => {
                const normalized = theme.toLowerCase();
                themeCounts[normalized] = (themeCounts[normalized] || 0) + 1;
            });
        });

        const suggestionsMap = {
            'anxiety': 'Practice a 5-minute breathing exercise daily.',
            'stress': 'Take a 10-minute break away from screens each afternoon.',
            'self-doubt': 'Write down one personal accomplishment at the end of each day.',
            'loneliness': 'Reach out to one friend or family member this week.',
            'low mood': 'Spend 15 minutes outside in the sun each day.',
        };

        const suggestions = new Set();
        for (const theme in themeCounts) {
            if (suggestionsMap[theme] && themeCounts[theme] > 1) {
                suggestions.add(suggestionsMap[theme]);
            }
        }
        return Array.from(suggestions);
    }, [entries]);

    if (suggestedGoals.length === 0) return null;

    return (
        <div className="emote-panel">
            <h3 className="emote-title-gradient mb-4 text-emote-section">Suggestions</h3>
            <div className="space-y-3">
                {suggestedGoals.map((suggestion, index) => (
                    <div key={index} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex-1 text-emote-body leading-relaxed text-slate-800">{suggestion}</p>
                        <button type="button" onClick={() => onAddGoal(suggestion)} className="emote-btn-primary shrink-0 py-2 px-4">Add goal</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GoalCard = ({ goal, onToggleCompletion }) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const isCompletedToday = goal.completions && goal.completions[today];

    return (
        <div className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-300 ${isCompletedToday ? 'border-emerald-200 bg-emerald-50/80 border-l-4 border-l-emerald-500' : 'border-slate-200 bg-white shadow-sm border-l-4 border-l-sky-400'}`}>
            <p className={`text-emote-card-title ${isCompletedToday ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{goal.title}</p>
            <button 
                onClick={() => onToggleCompletion(goal.id, today)}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-105 ${isCompletedToday ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50'}`}
                title="Mark as complete for today"
            >
                {isCompletedToday && <span className="text-emote-card-title">✓</span>}
            </button>
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
            <p className="mb-4 mt-1.5 text-emote-muted leading-relaxed text-slate-500">
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