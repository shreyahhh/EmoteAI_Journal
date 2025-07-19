import PencilIcon from './PencilIcon';
import TrashIcon from './TrashIcon';

const JournalEntryCard = ({ entry, onEdit, onDelete }) => {
    const moodEmojis = {
        happy: '😊', sad: '😢', angry: '😠', anxious: '😟', neutral: '😐'
    };
    
    const formattedDate = entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Just now';

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
            <p className="text-gray-300 whitespace-pre-wrap">{entry.content}</p>
        </div>
    );
};

export default JournalEntryCard; 