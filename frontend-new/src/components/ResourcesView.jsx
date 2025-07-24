import React, { useState, useMemo } from 'react';
import ResourceDetailModal from './ResourceDetailModal';
import ResourceCard from './ResourceCard';

// --- Updated Component: Resources View ---
// This component's recommendation logic is now significantly smarter, using AI-generated themes.
const ResourcesView = ({ entries }) => {
    const [selectedResource, setSelectedResource] = useState(null);
    const recommendations = useMemo(() => {
        const recentEntries = entries.slice(0, 5);
        if (recentEntries.length < 2) return ['general'];
        const themeCounts = {};
        recentEntries.forEach(entry => {
            if (entry.themes && Array.isArray(entry.themes)) {
                entry.themes.forEach(theme => {
                    const normalizedTheme = theme.toLowerCase();
                    themeCounts[normalizedTheme] = (themeCounts[normalizedTheme] || 0) + 1;
                });
            }
        });
        const themeMap = {
            'anxiety': 'anxiety',
            'stress': 'anxiety',
            'worry': 'anxiety',
            'sadness': 'depression',
            'low mood': 'depression',
            'depression': 'depression',
            'anger': 'anger',
            'frustration': 'anger',
            'self-doubt': 'confidence',
            'insecurity': 'confidence',
            'relationships': 'relationships',
            'family conflict': 'relationships',
            'loneliness': 'relationships',
            'personal growth': 'growth',
            'mindfulness': 'growth',
        };
        const suggestions = new Set();
        for (const theme in themeCounts) {
            if (themeMap[theme]) {
                suggestions.add(themeMap[theme]);
            }
        }
        return suggestions.size > 0 ? Array.from(suggestions) : ['general'];
    }, [entries]);
    const allResources = {
        anxiety: { id: 'anxiety', title: "Managing Anxiety", description: "Techniques to calm a worried mind and handle feelings of stress.", icon: '🧠' },
        depression: { id: 'depression', title: "Lifting Your Mood", description: "Strategies for when you're feeling down or unmotivated.", icon: '☀️' },
        anger: { id: 'anger', title: "Handling Anger", description: "Constructive ways to process and express anger without causing harm.", icon: '💨' },
        confidence: { id: 'confidence', title: "Building Confidence", description: "Exercises to challenge self-doubt and recognize your strengths.", icon: '💪' },
        relationships: { id: 'relationships', title: "Navigating Relationships", description: "Guidance on communication, boundaries, and connection with others.", icon: '🤝' },
        growth: { id: 'growth', title: "Mindfulness & Growth", description: "Cultivate awareness and continue your personal growth journey.", icon: '🌱' },
        general: { id: 'general', title: "General Wellness", description: "General tips and information for maintaining your mental well-being.", icon: '❤️' }
    };
    return (
        <>
            {selectedResource && <ResourceDetailModal resource={selectedResource} onClose={() => setSelectedResource(null)} />}
            <div className="animate-fade-in">
                <div className="bg-red-900/40 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6 shadow-lg" role="alert">
                    <strong className="font-bold">Crisis Support: </strong>
                    <span className="block sm:inline">If you are in a crisis or any other person may be in danger, please don't use this site. Contact a local crisis hotline.</span>
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">Recommended For You</h2>
                <p className="text-gray-400 mb-6">Based on the themes in your recent entries, here are some resources you might find helpful.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map(key => (
                        <ResourceCard key={key} resource={allResources[key]} onClick={() => setSelectedResource(allResources[key])} />
                    ))}
                </div>
                <hr className="my-8 border-gray-700" />
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">Full Resource Library</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(allResources).map(resource => (
                        <ResourceCard key={resource.id} resource={resource} onClick={() => setSelectedResource(resource)} />
                    ))}
                </div>
            </div>
        </>
    );
};

export default ResourcesView; 