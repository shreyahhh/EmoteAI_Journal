import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// --- Helper function to get a weekly summary from Gemini API ---
async function getWeeklySummaryWithAI(entriesText) {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // Use Gemini API key from environment variables
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `
        As a compassionate psychologist, you are reviewing a client's journal entries from the past week.
        Please provide a gentle and insightful summary based on the text provided.
        Provide your response in a structured JSON format. Do not include any text outside of the JSON object.
        The JSON object should have the following keys:
        - "overallFeeling": A short paragraph (2-3 sentences) summarizing the overall emotional tone of the week.
        - "keyThemes": An array of 2-4 strings identifying the most prominent themes or topics.
        - "positiveMoment": A short paragraph highlighting a specific positive moment or feeling mentioned in the entries. If no clear positive moment exists, create a gentle encouragement.
        - "gentleSuggestion": A single, forward-looking, and encouraging suggestion for the week ahead.
        Journal Entries Text:
        ---
        ${entriesText}
        ---
    `;
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        }
    };
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const result = await response.json();
        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
            const summary = JSON.parse(result.candidates[0].content.parts[0].text);
            return summary;
        } else {
            return { overallFeeling: "Could not generate a summary at this time.", keyThemes: [], positiveMoment: "", gentleSuggestion: "Try to be kind to yourself this week." };
        }
    } catch (error) {
        console.error("AI Summary Generation Error:", error);
        return { overallFeeling: "An error occurred while analyzing your week.", keyThemes: [], positiveMoment: "", gentleSuggestion: "Try to be kind to yourself this week." };
    }
}

// --- Component: Weekly Summary ---
const WeeklySummary = ({ entries }) => {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setError('');
        setSummary(null);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentEntries = entries.filter(entry => entry.createdAt && entry.createdAt.toDate() > oneWeekAgo);
        if (recentEntries.length < 3) {
            setError("You need at least 3 entries in the last 7 days to generate a summary.");
            setIsLoading(false);
            return;
        }
        const entriesText = recentEntries.map(e => `Entry on ${e.createdAt.toDate().toLocaleDateString()}:\nTitle: ${e.title}\nContent: ${e.content}`).join('\n\n---\n\n');
        const generatedSummary = await getWeeklySummaryWithAI(entriesText);
        setSummary(generatedSummary);
        setIsLoading(false);
    };
    return (
        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-300">Your Weekly AI Summary</h3>
            <p className="text-gray-400 mb-6">Get a personalized summary of your thoughts and feelings from the last 7 days.</p>
            <button 
                onClick={handleGenerateSummary}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-teal-500 text-white font-bold py-3 px-5 rounded-full shadow-lg shadow-purple-500/20 transition-all duration-300 hover:scale-105 hover:shadow-teal-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analyzing Your Week...
                    </>
                ) : "Generate My Weekly Summary"}
            </button>
            {error && <p className="text-red-400 mt-4 text-center font-semibold">{error}</p>}
            {summary && (
                <div className="mt-6 border-t border-gray-700 pt-6 space-y-6 animate-fade-in">
                    <div>
                        <h4 className="font-semibold text-purple-300 mb-2">Overall Feeling</h4>
                        <p className="text-gray-300">{summary.overallFeeling}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-purple-300 mb-2">Key Themes This Week</h4>
                        <div className="flex flex-wrap gap-2">
                            {summary.keyThemes?.map((theme, index) => (
                                <span key={index} className="px-3 py-1 text-sm font-semibold rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">{theme}</span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-300 mb-2">A Positive Moment</h4>
                        <p className="text-gray-300 italic">"{summary.positiveMoment}"</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-300 mb-2">A Gentle Suggestion For You</h4>
                        <p className="text-gray-300">{summary.gentleSuggestion}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const getMoodColor = (mood) => {
    const colors = { happy: '#34d399', sad: '#60a5fa', angry: '#f87171', anxious: '#a78bfa', neutral: '#9ca3af' };
    return colors[mood] || '#9ca3af';
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 bg-gray-800/80 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm">
          <p className="label text-gray-200 font-semibold">{`${label}`}</p>
          <p className="intro text-teal-300">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};

// --- Component: Activity-Mood Correlation Chart ---
const ActivityMoodChart = ({ entries }) => {
    const chartData = useMemo(() => {
        const activityMoods = {};
        entries.forEach(entry => {
            const isPositive = entry.mood === 'happy' || (entry.sentimentScore && entry.sentimentScore > 2);
            if (isPositive && entry.activities && entry.activities.length > 0) {
                entry.activities.forEach(activityId => {
                    activityMoods[activityId] = (activityMoods[activityId] || 0) + 1;
                });
            }
        });
        const activityNames = { exercise: 'Exercise', work: 'Work', social: 'Socialized', hobby: 'Hobby', rest: 'Rested', family: 'Family Time', chores: 'Chores', nature: 'Nature' };
        return Object.entries(activityMoods)
            .map(([activityId, count]) => ({
                name: activityNames[activityId] || activityId,
                count: count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Show top 5
    }, [entries]);

    if (chartData.length === 0) {
        return (
             <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2 text-white">Mood-Boosting Activities</h3>
                <p className="text-gray-400">Tag activities in your journal entries to see which ones correlate with positive moods!</p>
            </div>
        );
    }
    return (
        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 text-white">Mood-Boosting Activities</h3>
            <p className="text-gray-400 mb-6">These are activities you've most frequently tagged on positive days.</p>
            <div className="space-y-3">
                {chartData.map(item => {
                    const barWidth = `${(item.count / Math.max(...chartData.map(d => d.count))) * 100}%`;
                    return (
                        <div key={item.name} className="flex items-center gap-4 text-sm">
                            <span className="w-28 text-right text-gray-300 font-medium">{item.name}</span>
                            <div className="flex-1 bg-gray-700/50 rounded-full h-6">
                                <div 
                                    className="bg-gradient-to-r from-purple-500 to-teal-400 h-6 rounded-full flex items-center justify-end px-2 transition-all duration-500 ease-out"
                                    style={{ width: barWidth }}
                                >
                                   <span className="font-bold text-white text-xs">{item.count}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Component: Word Cloud Chart ---
const WordCloudChart = ({ entries }) => {
    const wordData = useMemo(() => {
        const stopWords = new Set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 've', 'll', 'm', 're']);
        const wordCounts = {};
        const allText = entries.map(e => e.content).join(' ');
        const words = allText.toLowerCase().split(/\s+/).map(word => word.replace(/[^a-z0-9]/g, ''));
        words.forEach(word => {
            if (word && !stopWords.has(word)) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });
        return Object.entries(wordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 40)
            .map(([text, value]) => ({ text, value }));
    }, [entries]);

    if (wordData.length < 5) {
        return (
             <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2 text-white">Word Cloud</h3>
                <p className="text-gray-400">Write more entries to generate a cloud of your most-used words!</p>
            </div>
        );
    }

    const maxCount = Math.max(...wordData.map(d => d.value), 1);
    const minCount = Math.min(...wordData.map(d => d.value));
    const getFontSize = (count) => {
        const minFontSize = 14;
        const maxFontSize = 48;
        if (maxCount === minCount) return minFontSize;
        const scale = (count - minCount) / (maxCount - minCount);
        return minFontSize + (scale * (maxFontSize - minFontSize));
    };
    
    const colors = ['#a78bfa', '#818cf8', '#60a5fa', '#38bdf8', '#22d3ee', '#6ee7b7', '#a3e635'];

    return (
        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 text-white">Word Cloud</h3>
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 p-4">
                {wordData.map((word, index) => (
                    <span 
                        key={word.text}
                        style={{ 
                            fontSize: `${getFontSize(word.value)}px`,
                            color: colors[index % colors.length],
                            lineHeight: '1.2',
                        }}
                        className={`font-bold transition-all duration-300 hover:text-white hover:scale-110`}
                    >
                        {word.text}
                    </span>
                ))}
            </div>
        </div>
    );
};

const InsightsDashboard = ({ entries }) => {
    const moodDistribution = useMemo(() => {
        const counts = { happy: 0, sad: 0, angry: 0, anxious: 0, neutral: 0 };
        entries.forEach(entry => {
            if (counts.hasOwnProperty(entry.mood)) {
                counts[entry.mood]++;
            }
        });
        return Object.keys(counts).map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), count: counts[key], fill: getMoodColor(key) }));
    }, [entries]);

    const sentimentOverTime = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return entries
            .filter(entry => entry.createdAt && entry.createdAt.toDate() > thirtyDaysAgo)
            .map(entry => ({
                date: entry.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                score: entry.sentimentScore
            }))
            .reverse();
    }, [entries]);

    if (entries.length === 0) {
        return (
            <div className="text-center bg-gray-800/50 p-8 rounded-2xl border border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white">Not enough data for insights.</h3>
                <p className="text-gray-400 mt-2">Write a few journal entries to see your emotional trends here!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <WeeklySummary entries={entries} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-4 text-white">Mood Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={moodDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="name" stroke="#a0aec0" tick={{ fill: '#a0aec0' }} />
                            <YAxis stroke="#a0aec0" tick={{ fill: '#a0aec0' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(167, 139, 250, 0.1)' }}/>
                            <Bar dataKey="count" name="Entries" >
                                {moodDistribution.map((entry, index) => (
                                    <div key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-4 text-white">Sentiment Over Time (Last 30 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={sentimentOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="date" stroke="#a0aec0" tick={{ fill: '#a0aec0' }} />
                            <YAxis stroke="#a0aec0" domain={[-5, 5]} tick={{ fill: '#a0aec0' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(167, 139, 250, 0.1)' }}/>
                            <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                            <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: '#34d399' }} activeDot={{ r: 8, fill: '#34d399' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <WordCloudChart entries={entries} />
            <ActivityMoodChart entries={entries} />
        </div>
    );
};

export default InsightsDashboard;