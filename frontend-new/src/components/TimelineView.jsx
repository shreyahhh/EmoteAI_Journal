import React, { useState, useMemo } from 'react';

const MoodTag = ({ mood, emotions }) => {
    const displayMood = (mood || (emotions && emotions[0]) || 'neutral').toLowerCase();

    const moodStyles = {
        happy: 'bg-green-400/20 text-green-300 border-green-400/30',
        sad: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
        angry: 'bg-red-400/20 text-red-300 border-red-400/30',
        anxious: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
        neutral: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
    };
    return (
        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${moodStyles[displayMood] || moodStyles.neutral}`}>
            {displayMood.charAt(0).toUpperCase() + displayMood.slice(1)}
        </span>
    );
};

// --- Component: The Main View for the Timeline Tab ---
const TimelineView = ({ entries }) => {
    const [selectedEntry, setSelectedEntry] = useState(null);

    const entriesByMonth = useMemo(() => {
        const groups = {};
        entries.forEach(entry => {
            const monthYear = entry.createdAt?.toDate ? 
                entry.createdAt.toDate().toLocaleString('default', { month: 'long', year: 'numeric' }) :
                'Unknown Date';
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(entry);
        });
        return groups;
    }, [entries]);

    if (entries.length === 0) {
        return (
            <div className="text-center bg-gray-800/50 p-8 rounded-2xl border border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white">Your timeline is empty.</h3>
                <p className="text-gray-400 mt-2">Start writing in your journal to build your personal history!</p>
            </div>
        );
    }

    return (
        <>
            {selectedEntry && <FullEntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
            
            <div className="max-w-4xl mx-auto animate-fade-in">
                {Object.entries(entriesByMonth).map(([monthYear, monthEntries]) => (
                    <div key={monthYear} className="relative pl-8 py-6 border-l-2 border-gray-700/50">
                        <div className="absolute -left-[9px] top-8 w-4 h-4 bg-purple-500 rounded-full border-4 border-gray-900 shadow-md"></div>
                        
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-300 mb-8">{monthYear}</h2>
                        <div className="space-y-4">
                            {monthEntries.map(entry => (
                                <TimelineEntryCard key={entry.id} entry={entry} onClick={() => setSelectedEntry(entry)} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

// --- Component: A Compact Card for Each Entry on the Timeline ---
const TimelineEntryCard = ({ entry, onClick }) => {
    const day = entry.createdAt?.toDate ? entry.createdAt.toDate().getDate() : new Date().getDate();

    return (
        <button onClick={onClick} className="w-full text-left bg-gray-800/50 p-4 rounded-xl shadow-lg flex items-center gap-4 border border-gray-700 hover:bg-gray-700/60 hover:border-purple-500/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-full flex flex-col items-center justify-center border border-purple-400/30">
                <span className="text-xl font-bold text-purple-300">{day}</span>
            </div>
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-gray-100 truncate">{entry.title || "Untitled Entry"}</p>
                <p className="text-sm text-gray-400">Click to read this memory</p>
            </div>
            <div className="flex-shrink-0">
                 <MoodTag mood={entry.mood} emotions={entry.emotions} />
            </div>
        </button>
    );
};

// --- Component: A Modal to Display the Full Entry ---
const FullEntryModal = ({ entry, onClose }) => {
    const formattedDate = useMemo(() => {
        if (!entry.createdAt?.toDate) {
            return null; // Return null if date is missing
        }
        const date = entry.createdAt.toDate();
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' }).toUpperCase();
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }, [entry.createdAt]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800/80 border border-gray-700 rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col backdrop-blur-lg">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-300">{entry.title || "Untitled Entry"}</h2>
                        {/* Conditionally render the date so it doesn't show if it's missing */}
                        {formattedDate && <p className="text-sm text-gray-400">{formattedDate}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-700 hover:text-white transition-all duration-200 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 -mr-2 flex-grow">
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                </div>
            </div>
        </div>
    );
};

export default TimelineView;