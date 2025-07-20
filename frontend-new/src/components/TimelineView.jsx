import React, { useState, useMemo } from 'react';

// --- New Component: The Main View for the Timeline Tab ---
const TimelineView = ({ entries }) => {
    // State to manage which entry is currently being viewed in a modal
    const [selectedEntry, setSelectedEntry] = useState(null);

    // This useMemo hook groups all entries by month and year (e.g., "July 2025")
    const entriesByMonth = useMemo(() => {
        const groups = {};
        // We iterate through entries in reverse chronological order
        entries.forEach(entry => {
            let monthYear;
            if (entry.createdAt?.toDate) {
                const date = entry.createdAt.toDate();
                monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            } else {
                monthYear = 'Unknown Date';
            }
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(entry);
        });
        return groups;
    }, [entries]);

    const handleEntryClick = (entry) => {
        setSelectedEntry(entry);
    };

    if (entries.length === 0) {
        return (
            <div className="text-center bg-white p-8 rounded-2xl border border-orange-100">
                <h3 className="text-xl font-semibold">Your timeline is empty.</h3>
                <p className="text-gray-400 mt-2">Start writing in your journal to build your personal history!</p>
            </div>
        );
    }

    return (
        <>
            {/* The modal to show the full entry details */}
            {selectedEntry && <FullEntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
            
            <div className="max-w-4xl mx-auto">
                {Object.entries(entriesByMonth).map(([monthYear, monthEntries]) => (
                    <div key={monthYear} className="relative pl-8 py-6 border-l-2 border-orange-200">
                        {/* Month Marker Dot */}
                        <div className="absolute -left-[9px] top-8 w-4 h-4 bg-purple-500 rounded-full border-4 border-gray-900"></div>
                        
                        <h2 className="text-2xl font-bold text-purple-400 mb-6">{monthYear}</h2>
                        <div className="space-y-4">
                            {monthEntries.map(entry => (
                                <TimelineEntryCard key={entry.id} entry={entry} onClick={() => handleEntryClick(entry)} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

// --- New Component: A Compact Card for Each Entry on the Timeline ---
const TimelineEntryCard = ({ entry, onClick }) => {
    const moodEmojis = { happy: '😊', sad: '😢', angry: '😠', anxious: '😟', neutral: '😐' };
    let day = '';
    if (entry.createdAt?.toDate) {
        day = entry.createdAt.toDate().getDate();
    } else {
        day = new Date().getDate(); // fallback to today
    }

    return (
        <button onClick={onClick} className="w-full text-left bg-white p-4 rounded-lg shadow-lg flex items-center gap-4 hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 border border-orange-100">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-orange-700">{day}</span>
            </div>
            <div className="flex-grow">
                <p className="font-bold text-orange-900 truncate">{entry.title || "Untitled Entry"}</p>
                <p className="text-sm text-orange-400">Click to read this memory</p>
            </div>
            <div className="text-3xl">
                {moodEmojis[entry.mood] || '😐'}
            </div>
        </button>
    );
};

// --- New Component: A Modal to Display the Full Entry ---
const FullEntryModal = ({ entry, onClose }) => {
    const moodEmojis = { happy: '😊', sad: '😢', angry: '😠', anxious: '😟', neutral: '😐' };
    let formattedDate = 'Unknown';
    if (entry.createdAt?.toDate) {
        formattedDate = entry.createdAt.toDate().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
    }
    const tagColors = ["bg-blue-500/20 text-blue-300", "bg-purple-500/20 text-purple-300", "bg-teal-500/20 text-teal-300"];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col border border-orange-100">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-orange-900">{entry.title || "Untitled Entry"}</h2>
                        <p className="text-sm text-orange-400">{formattedDate}</p>
                    </div>
                    <button onClick={onClose} className="text-orange-400 hover:text-orange-600 text-3xl font-bold">&times;</button>
                </div>
                <div className="overflow-y-auto text-orange-800 space-y-4">
                    <p className="whitespace-pre-wrap">{entry.content}</p>
                    {(entry.emotions?.length > 0 || entry.themes?.length > 0) && (
                        <div className="border-t border-orange-100 pt-4 flex flex-wrap gap-2">
                            <span className="text-2xl mr-2">{moodEmojis[entry.mood] || '😐'}</span>
                            {entry.emotions?.map((emotion, index) => (
                                <span key={`emo-${index}`} className={`px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-700`}>{emotion}</span>
                            ))}
                            {entry.themes?.map((theme, index) => (
                                <span key={`theme-${index}`} className={`px-3 py-1 text-sm font-semibold rounded-full bg-orange-50 text-orange-600`}>{theme}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimelineView; 