import React, { useState, useMemo } from 'react';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import MoodSelector from './MoodSelector';
import Modal from './Modal';
import JournalEntryCard from './JournalEntryCard';

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
    const [currentEntry, setCurrentEntry] = useState({ title: '', content: '', mood: 'neutral' });
    const [editingEntryId, setEditingEntryId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [exploringTheme, setExploringTheme] = useState(null); // New state for theme explorer
    const [searchQuery, setSearchQuery] = useState(''); // New state for search
    const [selectedActivities, setSelectedActivities] = useState([]);
    const db = getFirestore();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleMoodChange = (mood) => {
        setCurrentEntry(prev => ({ ...prev, mood }));
    };

    const handleSaveEntry = async (e) => {
        e.preventDefault();
        if (!currentEntry.content.trim()) return;
        setIsSaving(true);
        setStatusMessage('Analyzing your entry...');
        const analysis = await analyzeEntryWithAI(currentEntry.content);
        setStatusMessage('Saving...');
        const entryData = {
            ...currentEntry,
            sentimentScore: analysis.sentimentScore,
            emotions: analysis.emotions || [],
            themes: analysis.themes || [],
            activities: selectedActivities,
        };
        try {
            if (editingEntryId) {
                const entryRef = doc(db, 'journal_entries', editingEntryId);
                await updateDoc(entryRef, { ...entryData, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, 'journal_entries'), { ...entryData, userId: user.uid, createdAt: serverTimestamp() });
            }
            resetForm();
        } catch (error) {
            console.error("Error saving entry: ", error);
            setStatusMessage('Error saving entry.');
        } finally {
            setIsSaving(false);
            setStatusMessage('');
        }
    };
    
    const confirmDelete = (id) => {
        setEntryToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDeleteEntry = async () => {
        if (!entryToDelete) return;
        try {
            await deleteDoc(doc(db, 'journal_entries', entryToDelete));
        } catch (error) {
            console.error("Error deleting entry: ", error);
        } finally {
            setShowDeleteModal(false);
            setEntryToDelete(null);
        }
    };

    const startEditing = (entry) => {
        setEditingEntryId(entry.id);
        setCurrentEntry({ title: entry.title, content: entry.content, mood: entry.mood });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setCurrentEntry({ title: '', content: '', mood: 'neutral' });
        setEditingEntryId(null);
        setSelectedActivities([]);
    };

    const filteredEntries = useMemo(() => {
        if (!searchQuery) return entries;
        const query = searchQuery.toLowerCase();
        return entries.filter(entry => {
            const titleMatch = entry.title?.toLowerCase().includes(query);
            const contentMatch = entry.content?.toLowerCase().includes(query);
            return titleMatch || contentMatch;
        });
    }, [entries, searchQuery]);

    return (
        <>
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteEntry} title="Delete Entry" message="Are you sure you want to delete this entry? This action cannot be undone." />
            {/* Theme Explorer Modal */}
            {exploringTheme && (
                <ThemeExplorerModal
                    theme={exploringTheme}
                    entries={entries}
                    onClose={() => setExploringTheme(null)}
                    onEntryClick={(entry) => {
                        // Optional: clicking an entry in the modal could scroll you to it
                        // or open it for editing. For now, we just log it.
                        console.log("Clicked on entry:", entry.id);
                    }}
                />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg sticky top-8">
                        <h2 className="text-2xl font-bold mb-4">{editingEntryId ? 'Edit Entry' : 'New Entry'}</h2>
                        <form onSubmit={handleSaveEntry}>
                            <input type="text" name="title" value={currentEntry.title} onChange={handleInputChange} placeholder="Entry Title (Optional)" className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            <textarea name="content" value={currentEntry.content} onChange={handleInputChange} placeholder="What's on your mind?" rows="8" className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                            <div className="mt-4">
                                <ActivitySelector
                                    selectedActivities={selectedActivities}
                                    onSelectionChange={setSelectedActivities}
                                />
                            </div>
                            <MoodSelector selectedMood={currentEntry.mood} onMoodChange={handleMoodChange} />
                            <div className="flex items-center gap-4 mt-6">
                                <button type="submit" disabled={isSaving} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-500 flex justify-center items-center">
                                    {isSaving ? statusMessage : (editingEntryId ? 'Update Entry' : 'Save Entry')}
                                </button>
                                {(editingEntryId || currentEntry.content) && (<button type="button" onClick={resetForm} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition">Cancel</button>)}
                            </div>
                        </form>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Your Journal</h2>
                        <div className="w-full max-w-xs">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search entries..."
                                className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                            />
                        </div>
                    </div>
                    {filteredEntries.length > 0 ? (
                        <div className="space-y-6">
                            {filteredEntries.map(entry => (
                                <JournalEntryCard
                                    key={entry.id}
                                    entry={entry}
                                    onEdit={() => startEditing(entry)}
                                    onDelete={() => confirmDelete(entry.id)}
                                    onThemeClick={(theme) => setExploringTheme(theme)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center bg-gray-800 p-8 rounded-2xl">
                            <h3 className="text-xl font-semibold">No entries found.</h3>
                            <p className="text-gray-400 mt-2">{searchQuery ? `Your search for "${searchQuery}" did not match any entries.` : "Use the form to write your first journal entry!"}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// --- Theme Explorer Modal with Accordion ---
const ThemeExplorerModal = ({ theme, entries, onClose }) => {
    // New state to track which entry is currently expanded. `null` means none are.
    const [expandedEntryId, setExpandedEntryId] = useState(null);

    // Filter the entries to find all that include the selected theme.
    const filteredEntries = entries.filter(entry => 
        entry.themes && entry.themes.some(t => t.toLowerCase() === theme.toLowerCase())
    );

    // This function handles expanding or collapsing an entry.
    const handleEntryClick = (entryId) => {
        // If the clicked entry is already expanded, collapse it. Otherwise, expand it.
        setExpandedEntryId(currentId => (currentId === entryId ? null : entryId));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">
                        Entries about: <span className="text-purple-400">{theme}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
                </div>
                <div className="overflow-y-auto space-y-2">
                    {filteredEntries.length > 0 ? (
                        filteredEntries.map(entry => (
                            <div key={entry.id} className="bg-gray-700/50 rounded-lg transition-all">
                                <button 
                                    onClick={() => handleEntryClick(entry.id)}
                                    className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700 rounded-lg focus:outline-none"
                                >
                                    <div>
                                        <p className="font-semibold text-white">{entry.title || "Untitled Entry"}</p>
                                        <p className="text-sm text-gray-400">
                                            {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent'}
                                        </p>
                                    </div>
                                    <span className={`transform transition-transform duration-300 ${expandedEntryId === entry.id ? 'rotate-180' : ''}`}>▼</span>
                                </button>
                                {expandedEntryId === entry.id && (
                                    <div className="p-4 border-t border-gray-600">
                                        <p className="text-gray-300 whitespace-pre-wrap">{entry.content}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 p-4">No other entries found for this theme.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- New Component: Activity Selector ---
const ActivitySelector = ({ selectedActivities, onSelectionChange }) => {
    const allActivities = [
        { id: 'exercise', name: 'Exercise', icon: '🏃' },
        { id: 'work', name: 'Work', icon: '💼' },
        { id: 'social', name: 'Socialized', icon: '💬' },
        { id: 'hobby', name: 'Hobby', icon: '🎨' },
        { id: 'rest', name: 'Rested', icon: '😴' },
        { id: 'family', name: 'Family Time', icon: '👨‍👩‍👧' },
        { id: 'chores', name: 'Chores', icon: '🧹' },
        { id: 'nature', name: 'Nature', icon: '🌳' },
    ];
    const handleToggleActivity = (activityId) => {
        const newSelection = selectedActivities.includes(activityId)
            ? selectedActivities.filter(id => id !== activityId)
            : [...selectedActivities, activityId];
        onSelectionChange(newSelection);
    };
    return (
        <div>
            <label className="block text-gray-400 mb-2">What did you do today?</label>
            <div className="flex flex-wrap gap-2">
                {allActivities.map(activity => (
                    <button
                        key={activity.id}
                        type="button"
                        onClick={() => handleToggleActivity(activity.id)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                            selectedActivities.includes(activity.id)
                                ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        <span>{activity.icon}</span>
                        <span>{activity.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default JournalView; 