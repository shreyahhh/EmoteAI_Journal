import React from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import MoodSelector from './MoodSelector';
import JournalEntryCard from './JournalEntryCard';
import InsightsDashboard from './InsightsDashboard';

const Dashboard = ({ user }) => {
    const [entries, setEntries] = React.useState([]);
    const [currentEntry, setCurrentEntry] = React.useState({ title: '', content: '', mood: 'neutral' });
    const [editingEntryId, setEditingEntryId] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const entriesCollection = collection(db, 'journal_entries');
        const q = query(entriesCollection, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userEntries = [];
            querySnapshot.forEach((doc) => {
                userEntries.push({ id: doc.id, ...doc.data() });
            });
            setEntries(userEntries);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching entries: ", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleMoodChange = (mood) => {
        setCurrentEntry(prev => ({ ...prev, mood }));
    };

    const handleSaveEntry = async (e) => {
        e.preventDefault();
        if (!currentEntry.content.trim()) {
            alert("Entry content cannot be empty.");
            return;
        }
        setIsSaving(true);
        try {
            if (editingEntryId) {
                const entryRef = doc(db, 'journal_entries', editingEntryId);
                await updateDoc(entryRef, {
                    ...currentEntry,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, 'journal_entries'), {
                    ...currentEntry,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                });
            }
            resetForm();
        } catch (error) {
            console.error("Error saving entry: ", error);
            alert("Failed to save entry. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteEntry = async (id) => {
        if (window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'journal_entries', id));
            } catch (error) {
                console.error("Error deleting entry: ", error);
                alert("Failed to delete entry.");
            }
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
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">EMOTE</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 hidden sm:block">{user.email}</span>
                    <button onClick={handleLogout} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        Log Out
                    </button>
                </div>
            </header>
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg sticky top-8">
                        <h2 className="text-2xl font-bold mb-4">{editingEntryId ? 'Edit Entry' : 'New Entry'}</h2>
                        <form onSubmit={handleSaveEntry}>
                            <input
                                type="text"
                                name="title"
                                value={currentEntry.title}
                                onChange={handleInputChange}
                                placeholder="Entry Title (Optional)"
                                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <textarea
                                name="content"
                                value={currentEntry.content}
                                onChange={handleInputChange}
                                placeholder="What's on your mind?"
                                rows="8"
                                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            ></textarea>
                            <MoodSelector selectedMood={currentEntry.mood} onMoodChange={handleMoodChange} />
                            <div className="flex items-center gap-4 mt-6">
                                <button type="submit" disabled={isSaving} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-500">
                                    {isSaving ? 'Saving...' : (editingEntryId ? 'Update Entry' : 'Save Entry')}
                                </button>
                                {(editingEntryId || currentEntry.content) && (
                                     <button type="button" onClick={resetForm} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition">
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">Your Journal</h2>
                    {isLoading ? (
                        <p className="text-gray-400">Loading your entries...</p>
                    ) : entries.length > 0 ? (
                        <div className="space-y-6">
                            {entries.map(entry => (
                                <JournalEntryCard 
                                    key={entry.id} 
                                    entry={entry}
                                    onEdit={() => startEditing(entry)}
                                    onDelete={() => handleDeleteEntry(entry.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <InsightsDashboard entries={entries} />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard; 