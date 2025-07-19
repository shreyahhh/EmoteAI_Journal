import React from 'react';

const getMoodColor = (mood) => {
    const colors = { happy: '#48bb78', sad: '#4299e1', angry: '#f56565', anxious: '#9f7aea', neutral: '#a0aec0' };
    return colors[mood] || '#a0aec0';
};

const getSentimentY = (score) => {
    // Map sentiment score (-5 to +5) to y position (higher = more positive)
    const minY = 60, maxY = 10;
    const clamped = Math.max(-5, Math.min(5, score || 0));
    return minY + (maxY - minY) * ((clamped + 5) / 10);
};

const DotRepresentation = ({ entries }) => {
    if (!entries.length) return null;
    const width = Math.max(300, entries.length * 24);
    return (
        <div className="overflow-x-auto">
            <svg width={width} height={80} style={{ minWidth: 300 }}>
                {entries.map((entry, idx) => (
                    <g key={entry.id}>
                        <circle
                            cx={24 * idx + 20}
                            cy={getSentimentY(entry.sentimentScore)}
                            r={10}
                            fill={getMoodColor(entry.mood)}
                            stroke="#fff"
                            strokeWidth={2}
                        >
                            <title>
                                {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString() : ''}
                                {`\nMood: ${entry.mood || 'neutral'}`}
                                {`\nSentiment: ${entry.sentimentScore || 0}`}
                            </title>
                        </circle>
                    </g>
                ))}
                {/* Axis line */}
                <line x1={10} y1={60} x2={width-10} y2={60} stroke="#a0aec0" strokeDasharray="4 2" />
                <text x={10} y={75} fontSize={12} fill="#a0aec0">Negative</text>
                <text x={width-60} y={75} fontSize={12} fill="#a0aec0">Positive</text>
            </svg>
            <div className="text-xs text-gray-400 mt-2">Each dot represents a journal entry. Higher dots = more positive sentiment. Color = mood.</div>
        </div>
    );
};

export default DotRepresentation; 