import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import DotRepresentation from './DotRepresentation';

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
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Your Weekly AI Summary</h3>
            <p className="text-gray-400 mb-4">Get a personalized summary of your thoughts and feelings from the last 7 days.</p>
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
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            {summary && (
                <div className="mt-6 border-t border-gray-700 pt-6 space-y-6">
                    <div>
                        <h4 className="font-semibold text-purple-400 mb-2">Overall Feeling</h4>
                        <p className="text-gray-300">{summary.overallFeeling}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-purple-400 mb-2">Key Themes This Week</h4>
                        <div className="flex flex-wrap gap-2">
                            {summary.keyThemes?.map((theme, index) => (
                                <span key={index} className="px-3 py-1 text-sm font-semibold rounded-full bg-teal-500/20 text-teal-300">{theme}</span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-400 mb-2">A Positive Moment</h4>
                        <p className="text-gray-300 italic">"{summary.positiveMoment}"</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-400 mb-2">A Gentle Suggestion For You</h4>
                        <p className="text-gray-300">{summary.gentleSuggestion}</p>
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
            <div className="text-center bg-gray-800 p-8 rounded-2xl">
                <h3 className="text-xl font-semibold">Not enough data for insights.</h3>
                <p className="text-gray-400 mt-2">Write a few journal entries to see your emotional trends here!</p>
            </div>
        );
    }
    return (
        <div className="space-y-8">
            <WeeklySummary entries={entries} />
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
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
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
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
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">Dot Representation of Entries</h3>
                <DotRepresentation entries={entries} />
            </div>
        </div>
    );
};

export default InsightsDashboard; 