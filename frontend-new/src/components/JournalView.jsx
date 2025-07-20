import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// --- Helper function to call the Gemini API for analysis ---
async function analyzeEntryWithAI(text) {
    const apiKey = "AIzaSyA3lz7Bh3KuM2SbwwoDhvRQy5jhShrAxHc"; // Inserted user-provided Gemini API key
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

const JournalView = ({ entries, user }) => {
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
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="card sticky top-8 bg-white border border-orange-100">
                    <h2 className="text-2xl font-bold mb-4">New Entry</h2>
                    <form onSubmit={handleSaveEntry} className="space-y-4">
                        <input type="text" value={currentEntry.title} onChange={e => setCurrentEntry({...currentEntry, title: e.target.value})} placeholder="Title of your entry" className="w-full p-3 bg-orange-50 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        <textarea value={currentEntry.content} onChange={e => setCurrentEntry({...currentEntry, content: e.target.value})} placeholder="What's on your mind?" rows="10" className="w-full p-3 bg-orange-50 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400"></textarea>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {activityOptions.map((activity) => (
                                <button
                                    type="button"
                                    key={activity.key}
                                    onClick={() => handleToggleActivity(activity.key)}
                                    className={`px-3 py-1 rounded-full border text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${selectedActivities.includes(activity.key)
                                        ? 'bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] text-white border-[#2563eb] shadow-md scale-105'
                                        : 'bg-[#e0f2fe] text-[#2563eb] border-[#bae6fd] hover:bg-[#dbeafe] hover:text-[#f59e42]'}`}
                                >
                                    {activity.label}
                                </button>
                            ))}
                        </div>
                        <button type="submit" disabled={isSaving} className="w-full btn-gradient">{isSaving ? statusMessage : 'Save Entry'}</button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
                {entries.map(entry => (
                    <div key={entry.id} className="card card-accent bg-white border border-orange-100">
                        <h3 className="font-bold text-xl mb-1 text-gray-800">{entry.title || 'Untitled'}</h3>
                        <p className="text-sm text-gray-500 mb-3">{entry.createdAt?.toDate().toLocaleString()}</p>
                        <p className="whitespace-pre-wrap mb-4 text-gray-700">{entry.content}</p>
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-orange-100">
                             {entry.emotions?.map((e, i) => <span key={i} className="tag">{e}</span>)}
                             {entry.themes?.map((t, i) => <span key={i} className="tag">{t}</span>)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JournalView; 