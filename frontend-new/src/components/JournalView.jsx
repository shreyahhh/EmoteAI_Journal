import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import JournalEntryCard from './JournalEntryCard';

// --- Helper function to call the Gemini API for analysis ---
async function analyzeEntryWithAI(text) {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // Use Gemini API key from environment variables
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const prompt = `
        As a compassionate psychologist, analyze the following journal entry.
        Provide your analysis in a structured JSON format. Do not include any text outside of the JSON object.
        The JSON object should have the following keys:
        - "sentimentScore": A number from -10 (extremely negative) to 10 (extremely positive).
        - "emotions": An array of 2-4 strings identifying the dominant emotions (e.g., "Sadness", "Frustration", "Hope").
        - "themes": An array of 2-3 strings identifying the key themes or topics (e.g., "Work Stress", "Family Conflict").
        Journal Entry:
        ---
        ${text}
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
            const analysis = JSON.parse(result.candidates[0].content.parts[0].text);
            return analysis;
        } else {
            return { sentimentScore: 0, emotions: [], themes: ["General"] };
        }
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return { sentimentScore: 0, emotions: ["Analysis Error"], themes: [] };
    }
}

const JournalView = ({ entries, user, onEditEntry, onDeleteEntry }) => {
    const [currentEntry, setCurrentEntry] = useState({ title: '', content: ''});
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [selectedActivities, setSelectedActivities] = useState([]);

    const activityOptions = [
        { key: 'exercise', label: 'Exercise' },
        { key: 'work', label: 'Work' },
        { key: 'social', label: 'Social' },
        { key: 'hobby', label: 'Hobby' },
        { key: 'rest', label: 'Rest' },
        { key: 'family', label: 'Family' },
        { key: 'chores', label: 'Chores' },
        { key: 'nature', label: 'Nature' },
    ];

    const handleToggleActivity = (activity) => {
        setSelectedActivities((prev) =>
            prev.includes(activity)
                ? prev.filter((a) => a !== activity)
                : [...prev, activity]
        );
    };

    const handleSaveEntry = async (e) => {
        e.preventDefault();
        if (!currentEntry.content.trim()) return;
        setIsSaving(true);
        setStatusMessage('Analyzing...');
        const analysis = await analyzeEntryWithAI(currentEntry.content);
        setStatusMessage('Saving...');
        await addDoc(collection(db, 'journal_entries'), {
            ...currentEntry,
            ...analysis,
            activities: selectedActivities,
            userId: user.uid,
            createdAt: serverTimestamp()
        });
        setCurrentEntry({ title: '', content: ''});
        setSelectedActivities([]);
        setIsSaving(false);
        setStatusMessage('');
    };

    return (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* New Entry Form Column */}
            <div className="lg:col-span-1 sticky top-8">
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-4 text-white">New Entry</h2>
                    <form onSubmit={handleSaveEntry} className="space-y-4">
                        <input 
                            type="text" 
                            value={currentEntry.title} 
                            onChange={e => setCurrentEntry({...currentEntry, title: e.target.value})} 
                            placeholder="Title of your entry" 
                            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:border-[#a78bfa] transition"
                        />
                        <textarea 
                            value={currentEntry.content} 
                            onChange={e => setCurrentEntry({...currentEntry, content: e.target.value})} 
                            placeholder="What's on your mind?" 
                            rows="8" 
                            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:border-[#a78bfa] transition"
                        ></textarea>
                        <div className="pt-2">
                            <p className="text-sm font-semibold text-gray-400 mb-3">Tag Activities</p>
                            <div className="flex flex-wrap gap-2">
                                {activityOptions.map((activity) => (
                                    <button
                                        type="button"
                                        key={activity.key}
                                        onClick={() => handleToggleActivity(activity.key)}
                                        className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#a78bfa] ${selectedActivities.includes(activity.key)
                                            ? 'bg-[#a78bfa] text-black shadow-lg shadow-[#a78bfa]/20'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                                    >
                                        {activity.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSaving || !currentEntry.content.trim()} 
                            className="w-full bg-gradient-to-r from-[#a78bfa] to-[#f5eafe] text-black font-bold py-3 px-5 rounded-full shadow-lg shadow-[#a78bfa]/20 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#f5eafe] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    {statusMessage}
                                </>    
                            ) : 'Save Entry'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Entries List Column */}
            <div className="lg:col-span-2 space-y-6">
                {entries.map(entry => (
                    <JournalEntryCard 
                        key={entry.id} 
                        entry={entry} 
                        onEdit={() => onEditEntry(entry)} 
                        onDelete={() => onDeleteEntry(entry.id)} 
                    />
                ))}
            </div>
        </div>
    );
};

export default JournalView;