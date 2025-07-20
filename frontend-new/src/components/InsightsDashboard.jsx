import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
// Remove import DotRepresentation from './DotRepresentation';
// Install with: npm install @visx/wordcloud d3-shape d3-scale
import { Wordcloud } from '@visx/wordcloud';
// --- New Helper function to get a weekly summary from Gemini API ---
async function getWeeklySummaryWithAI(entriesText) {
    const apiKey = "AIzaSyA3lz7Bh3KuM2SbwwoDhvRQy5jhShrAxHc";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
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

// --- New Component: Weekly Summary ---
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
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-orange-600">Your Weekly AI Summary</h3>
            <p className="text-gray-600 mb-4">Get a personalized summary of your thoughts and feelings from the last 7 days.</p>
            <button 
                onClick={handleGenerateSummary}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-500 flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analyzing Your Week...
                    </>
                ) : "Generate My Weekly Summary"}
            </button>
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            {summary && (
                <div className="mt-6 border-t border-gray-200 pt-6 space-y-6">
                    <div>
                        <h4 className="font-semibold text-orange-500 mb-2">Overall Feeling</h4>
                        <p className="text-gray-700">{summary.overallFeeling}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-purple-400 mb-2">Key Themes This Week</h4>
                        <div className="flex flex-wrap gap-2">
                            {summary.keyThemes?.map((theme, index) => (
                                <span key={index} className="px-3 py-1 text-sm font-semibold rounded-full bg-teal-100 text-teal-700">{theme}</span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-400 mb-2">A Positive Moment</h4>
                        <p className="text-gray-700 italic">"{summary.positiveMoment}"</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-400 mb-2">A Gentle Suggestion For You</h4>
                        <p className="text-gray-700">{summary.gentleSuggestion}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const getMoodColor = (mood) => {
    const colors = { happy: '#48bb78', sad: '#4299e1', angry: '#f56565', anxious: '#9f7aea', neutral: '#a0aec0' };
    return colors[mood] || '#a0aec0';
};

// --- New Component: Activity-Mood Correlation Chart ---
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
            .sort((a, b) => b.count - a.count);
    }, [entries]);
    if (chartData.length === 0) {
        return (
             <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">Mood-Boosting Activities</h3>
                <p className="text-gray-400">Tag activities in your journal entries to see which ones correlate with positive moods!</p>
            </div>
        );
    }
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Mood-Boosting Activities</h3>
            <p className="text-gray-400 mb-4">These are activities you've most frequently tagged on positive days.</p>
            <div className="space-y-2">
                {chartData.map(item => (
                    <div key={item.name} className="flex items-center gap-4">
                        <span className="w-28 text-right text-gray-300">{item.name}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-6">
                            <div 
                                className="bg-green-500 h-6 rounded-full flex items-center justify-end px-2"
                                style={{ width: `${(item.count / Math.max(...chartData.map(d => d.count))) * 100}%` }}
                            >
                               <span className="font-bold text-white text-sm">{item.count}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- New and Improved Component: Word Cloud Chart ---
// This version has an updated color palette and random word rotation for a more dynamic look.
const WordCloudChart = ({ entries }) => {
    const wordData = useMemo(() => {
        // A list of common "stop words" to exclude from the cloud.
        const stopWords = new Set([
            'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 
            'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
            'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 
            'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 
            'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 
            'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 
            'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 
            'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 
            'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 
            'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 
            'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 
            'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 've', 'll', 'm', 're'
        ]);

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
            .slice(0, 50) // Increased to 50 for a denser cloud
            .map(([text, value]) => ({ text, value }));

    }, [entries]);

    if (wordData.length < 5) {
        return (
             <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">Word Cloud</h3>
                <p className="text-gray-400">Write more entries to generate a cloud of your most-used words!</p>
            </div>
        );
    }

    const maxCount = Math.max(...wordData.map(d => d.value));
    const minCount = Math.min(...wordData.map(d => d.value));

    const getFontSize = (count) => {
        const minFontSize = 16;
        const maxFontSize = 64; // Increased max size for more impact
        if (maxCount === minCount) return minFontSize;
        const scale = (count - minCount) / (maxCount - minCount);
        return minFontSize + (scale * (maxFontSize - minFontSize));
    };
    
    // --- New, warmer color palette inspired by the image ---
    const colors = ['#84cc16', '#f97316', '#a16207', '#4d7c0f', '#ea580c', '#ca8a04', '#65a30d'];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Word Cloud</h3>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 p-4">
                {wordData.map((word, index) => {
                    // --- New: Randomly decide to rotate the word ---
                    const shouldRotate = Math.random() > 0.8; // Rotate about 20% of words
                    const rotationClass = shouldRotate ? 'transform -rotate-90' : '';
                    
                    return (
                        <span 
                            key={word.text}
                            style={{ 
                                fontSize: `${getFontSize(word.value)}px`,
                                color: colors[index % colors.length],
                                lineHeight: '1', // Tighter line height
                                padding: '4px 0' // Add padding for rotated words
                            }}
                            className={`font-bold transition-all duration-300 ${rotationClass}`}
                        >
                            {word.text}
                        </span>
                    );
                })}
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
            <div className="text-center bg-white p-8 rounded-2xl border border-orange-100">
                <h3 className="text-xl font-semibold text-orange-900">Not enough data for insights.</h3>
                <p className="text-orange-400 mt-2">Write a few journal entries to see your emotional trends here!</p>
            </div>
        );
    }
    return (
        <div className="space-y-8">
            <WordCloudChart entries={entries} />
            <WeeklySummary entries={entries} />
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">Mood Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={moodDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="name" stroke="#a0aec0" />
                        <YAxis stroke="#a0aec0" allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none', color: '#e2e8f0' }} />
                        <Bar dataKey="count" barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">Sentiment Trend (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sentimentOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="date" stroke="#a0aec0" />
                        <YAxis stroke="#a0aec0" />
                        <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} name="Sentiment Score" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <ActivityMoodChart entries={entries} />
            {/* Remove the DotRepresentation component and any references to it from the JSX */}
        </div>
    );
};

export default InsightsDashboard; 