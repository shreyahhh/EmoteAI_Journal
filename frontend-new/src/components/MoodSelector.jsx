const MoodSelector = ({ selectedMood, onMoodChange }) => {
    const moods = {
        happy: { emoji: '😊', color: 'yellow' },
        sad: { emoji: '😢', color: 'blue' },
        angry: { emoji: '😠', color: 'red' },
        anxious: { emoji: '😟', color: 'indigo' },
        neutral: { emoji: '😐', color: 'gray' },
    };

    return (
        <div>
            <label className="block text-gray-400 mb-2">How are you feeling?</label>
            <div className="flex justify-around bg-gray-700 p-2 rounded-lg">
                {Object.entries(moods).map(([moodKey, { emoji, color }]) => (
                    <button
                        key={moodKey}
                        type="button"
                        onClick={() => onMoodChange(moodKey)}
                        className={`text-3xl p-2 rounded-full transition-transform transform hover:scale-125 ${selectedMood === moodKey ? `bg-${color}-500/30 ring-2 ring-${color}-400` : 'opacity-50 hover:opacity-100'}`}
                        title={moodKey.charAt(0).toUpperCase() + moodKey.slice(1)}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MoodSelector; 