import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import DotRepresentation from './DotRepresentation';

const getMoodColor = (mood) => {
    const colors = { happy: '#48bb78', sad: '#4299e1', angry: '#f56565', anxious: '#9f7aea', neutral: '#a0aec0' };
    return colors[mood] || '#a0aec0';
};

const InsightsDashboard = ({ entries }) => {
    const moodDistribution = React.useMemo(() => {
        const counts = { happy: 0, sad: 0, angry: 0, anxious: 0, neutral: 0 };
        entries.forEach(entry => {
            if (counts.hasOwnProperty(entry.mood)) {
                counts[entry.mood]++;
            }
        });
        return Object.keys(counts).map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), count: counts[key], fill: getMoodColor(key) }));
    }, [entries]);

    const sentimentOverTime = React.useMemo(() => {
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