import React, { useState } from 'react';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import MoodSelector from './MoodSelector';
import PencilIcon from './PencilIcon';
import TrashIcon from './TrashIcon';
import Modal from './Modal';

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
    };

    return (
        <>
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteEntry} title="Delete Entry" message="Are you sure you want to delete this entry? This action cannot be undone." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg sticky top-8">
                        <h2 className="text-2xl font-bold mb-4">{editingEntryId ? 'Edit Entry' : 'New Entry'}</h2>
                        <form onSubmit={handleSaveEntry}>
                            <input type="text" name="title" value={currentEntry.title} onChange={handleInputChange} placeholder="Entry Title (Optional)" className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            <textarea name="content" value={currentEntry.content} onChange={handleInputChange} placeholder="What's on your mind?" rows="8" className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
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
                    <h2 className="text-2xl font-bold mb-4">Your Journal</h2>
                    {entries.length > 0 ? (
                        <div className="space-y-6">
                            {entries.map(entry => <JournalEntryCard key={entry.id} entry={entry} onEdit={() => startEditing(entry)} onDelete={() => confirmDelete(entry.id)} />)}
                        </div>
                    ) : (
                        <div className="text-center bg-gray-800 p-8 rounded-2xl">
                            <h3 className="text-xl font-semibold">No entries yet.</h3>
                            <p className="text-gray-400 mt-2">Use the form to write your first journal entry!</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const JournalEntryCard = ({ entry, onEdit, onDelete }) => {
    const moodEmojis = { happy: '😊', sad: '😢', angry: '😠', anxious: '😟', neutral: '😐' };
    const formattedDate = entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';
    const getSentimentColor = (score) => {
        if (score > 5) return 'bg-green-400';
        if (score > 0) return 'bg-green-500';
        if (score < -5) return 'bg-red-400';
        if (score < 0) return 'bg-red-500';
        return 'bg-gray-500';
    };
    const tagColors = ["bg-blue-500/20 text-blue-300", "bg-purple-500/20 text-purple-300", "bg-teal-500/20 text-teal-300", "bg-pink-500/20 text-pink-300", "bg-orange-500/20 text-orange-300"];
    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg transition-all hover:shadow-purple-500/20">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white">{entry.title || 'Untitled Entry'}</h3>
                    <p className="text-sm text-gray-400">{formattedDate}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div title={`Sentiment Score: ${entry.sentimentScore || 0}`} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getSentimentColor(entry.sentimentScore)}`}></div>
                        <span className="text-2xl">{moodEmojis[entry.mood] || '😐'}</span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={onEdit} className="text-gray-400 hover:text-green-400 p-1 rounded-full"><PencilIcon /></button>
                       <button onClick={onDelete} className="text-gray-400 hover:text-red-400 p-1 rounded-full"><TrashIcon /></button>
                    </div>
                </div>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap mb-4">{entry.content}</p>
            {(entry.emotions?.length > 0 || entry.themes?.length > 0) && (
                <div className="border-t border-gray-700 pt-4 flex flex-wrap gap-2">
                    {entry.emotions?.map((emotion, index) => (
                        <span key={`emo-${index}`} className={`px-2 py-1 text-xs font-semibold rounded-full ${tagColors[index % tagColors.length]}`}>{emotion}</span>
                    ))}
                    {entry.themes?.map((theme, index) => (
                         <span key={`theme-${index}`} className={`px-2 py-1 text-xs font-semibold rounded-full ${tagColors[(index + 2) % tagColors.length]}`}>{theme}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JournalView; 