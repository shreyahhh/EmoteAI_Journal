import React from 'react';
import PencilIcon from './PencilIcon';
import TrashIcon from './TrashIcon';

const JournalEntryCard = React.memo(({ entry, onEdit, onDelete, onThemeClick }) => {
    const moodEmojis = {
        happy: '😊', sad: '😢', angry: '😠', anxious: '😟', neutral: '😐'
    };
    
    const formattedDate = entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Just now';
    
    const tagColors = ["bg-orange-100 text-orange-600", "bg-purple-100 text-purple-600", "bg-teal-100 text-teal-600", "bg-pink-100 text-pink-600", "bg-blue-100 text-blue-600"];
    const themeTagColors = ["bg-purple-200 text-purple-700 border border-purple-300", "bg-pink-200 text-pink-700 border border-pink-300", "bg-orange-200 text-orange-700 border border-orange-300", "bg-green-200 text-green-700 border border-green-300", "bg-blue-200 text-blue-700 border border-blue-300"];
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg transition-all hover:shadow-orange-200">
            <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-2">
                        <p className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">{formattedDate}</p>
                        <h3 className="text-xl font-bold text-gray-800">{entry.title || 'Untitled Entry'}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className="text-2xl" role="img" aria-label={`Mood: ${entry.mood || 'neutral'}`}>
                        {moodEmojis[entry.mood] || '😐'}
                    </span>
                    <div className="flex gap-2">
                       <button 
                         onClick={onEdit} 
                         className="text-gray-400 hover:text-green-400 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-green-300"
                         aria-label="Edit entry"
                       >
                         <PencilIcon />
                       </button>
                       <button 
                         onClick={onDelete} 
                         className="text-gray-400 hover:text-red-400 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
                         aria-label="Delete entry"
                       >
                         <TrashIcon />
                       </button>
                    </div>
                </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap mb-4">{entry.content}</p>
            {(entry.emotions?.length > 0 || entry.themes?.length > 0) && (
                <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-2">
                    {entry.emotions?.map((emotion, index) => (
                        <span 
                          key={`emo-${emotion}-${index}`} 
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${tagColors[index % tagColors.length]}`}
                        >
                          {emotion}
                        </span>
                    ))}
                    {entry.themes?.map((theme, index) => (
                         <button 
                            key={`theme-${theme}-${index}`} 
                            onClick={() => onThemeClick(theme)}
                            className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full shadow-sm ${themeTagColors[index % themeTagColors.length]} hover:ring-2 hover:ring-purple-400 transition-all border focus:outline-none focus:ring-2 focus:ring-purple-400`}
                            style={{ borderWidth: 2 }}
                            aria-label={`View entries about ${theme}`}
                        >
                            <svg className="w-3 h-3 text-purple-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <circle cx="10" cy="10" r="10" />
                            </svg>
                            {theme}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
        prevProps.entry.id === nextProps.entry.id &&
        prevProps.entry.content === nextProps.entry.content &&
        prevProps.entry.mood === nextProps.entry.mood &&
        JSON.stringify(prevProps.entry.emotions) === JSON.stringify(nextProps.entry.emotions) &&
        JSON.stringify(prevProps.entry.themes) === JSON.stringify(nextProps.entry.themes)
    );
});

JournalEntryCard.displayName = 'JournalEntryCard';

export default JournalEntryCard; 