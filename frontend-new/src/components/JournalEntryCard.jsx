import PencilIcon from './PencilIcon';
import TrashIcon from './TrashIcon';

const JournalEntryCard = ({ entry, onEdit, onDelete, onThemeClick }) => {
    const moodEmojis = {
        happy: '😊', sad: '😢', angry: '😠', anxious: '😟', neutral: '😐'
    };
    
    const formattedDate = entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Just now';
    const tagColors = ["bg-blue-500/20 text-blue-300", "bg-purple-500/20 text-purple-300", "bg-teal-500/20 text-teal-300", "bg-pink-500/20 text-pink-300", "bg-orange-500/20 text-orange-300"];
    const themeTagColors = ["bg-purple-700/30 text-purple-200 border border-purple-400", "bg-pink-700/30 text-pink-200 border border-pink-400", "bg-orange-700/30 text-orange-200 border border-orange-400", "bg-green-700/30 text-green-200 border border-green-400", "bg-blue-700/30 text-blue-200 border border-blue-400"];
    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg transition-all hover:shadow-purple-500/20">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white">{entry.title || 'Untitled Entry'}</h3>
                    <p className="text-sm text-gray-400 mb-4">{formattedDate}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{moodEmojis[entry.mood] || '😐'}</span>
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
                         <button 
                            key={`theme-${index}`} 
                            onClick={() => onThemeClick(theme)}
                            className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full shadow-sm ${themeTagColors[index % themeTagColors.length]} hover:ring-2 hover:ring-purple-400 transition-all border`}
                            style={{ borderWidth: 2 }}
                        >
                            <svg className="w-3 h-3 text-purple-300" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                            {theme}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JournalEntryCard; 