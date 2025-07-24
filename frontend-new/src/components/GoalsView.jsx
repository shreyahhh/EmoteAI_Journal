import React, { useState, useEffect, useMemo } from 'react';
// You would need to import your Firebase functions (getFirestore, collection, addDoc, etc.)
// For this snippet, we'll assume 'db' and 'user' objects are available.

// --- New Component: The Main View for the Goals Tab ---
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
        // Logic to add a new goal to Firestore
        // await addDoc(collection(db, 'goals'), { userId: user.uid, title, createdAt: serverTimestamp(), completions: {} });
        console.log("Adding new goal:", title);
        // For demo, add to local state
        setGoals(prev => [...prev, { id: Math.random().toString(), title, completions: {} }]);
    };

    const handleToggleCompletion = async (goalId, date) => {
        // Logic to update a goal's completion status in Firestore
        console.log("Toggling completion for goal:", goalId, "on date:", date);
        // For demo, update local state
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
            <div className="bg-black/20 backdrop-blur-sm border border-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">Your Active Goals</h3>
                {isLoading ? (
                    <p className="text-gray-400">Loading goals...</p>
                ) : goals.length > 0 ? (
                    <div className="space-y-4">
                        {goals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} onToggleCompletion={handleToggleCompletion} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">You haven't set any goals yet. Try adding one from the suggestions above or create your own!</p>
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
        <div className="bg-black/20 backdrop-blur-sm border border-gray-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">Suggestions For You</h3>
            <p className="text-gray-400 mb-4">Based on your recent entries, you might find these goals helpful:</p>
            <div className="space-y-3">
                {suggestedGoals.map((suggestion, index) => (
                    <div key={index} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                        <p className="text-gray-300 flex-1 mr-4">{suggestion}</p>
                        <button onClick={() => onAddGoal(suggestion)} className="bg-gradient-to-r from-purple-600 to-teal-500 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-transform transform hover:scale-105 shadow-md">Add Goal</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- New Component: A Card for a Single Goal ---
const GoalCard = ({ goal, onToggleCompletion }) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const isCompletedToday = goal.completions && goal.completions[today];

    return (
        <div className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 ${isCompletedToday ? 'bg-green-500/10 border-l-4 border-green-400' : 'bg-gray-800/50 border-l-4 border-purple-500'}`}>
            <p className={`text-lg ${isCompletedToday ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{goal.title}</p>
            <button 
                onClick={() => onToggleCompletion(goal.id, today)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${isCompletedToday ? 'bg-green-400 border-green-300' : 'border-gray-600 hover:border-green-400'}`}
                title="Mark as complete for today"
            >
                {isCompletedToday && <span className="text-white text-xl">✓</span>}
            </button>
        </div>
    );
};

// --- New Component: A Form to Add a Custom Goal ---
const NewGoalForm = ({ onAddGoal }) => {
    const [title, setTitle] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAddGoal(title);
        setTitle('');
    };

    return (
        <div className="bg-black/20 backdrop-blur-sm border border-gray-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">Create a New Goal</h3>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Meditate for 10 minutes"
                    className="flex-grow p-3 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow shadow-sm"
                />
                <button type="submit" className="bg-gradient-to-r from-purple-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg">Add Goal</button>
            </form>
        </div>
    );
};

export default GoalsView;