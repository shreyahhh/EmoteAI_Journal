import React from 'react';

const MoodSelector = ({ selectedMood, onMoodChange }) => {
    const moods = {
        happy: { emoji: '😊', color: 'yellow', label: 'Happy' },
        sad: { emoji: '😢', color: 'blue', label: 'Sad' },
        angry: { emoji: '😠', color: 'red', label: 'Angry' },
        anxious: { emoji: '😟', color: 'indigo', label: 'Anxious' },
        neutral: { emoji: '😐', color: 'gray', label: 'Neutral' },
    };

    const handleKeyDown = (e, moodKey) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onMoodChange(moodKey);
        }
    };

    return (
        <div>
            <label className="block text-gray-400 mb-2" id="mood-selector-label">
                How are you feeling?
            </label>
            <div 
                className="flex justify-around bg-gray-700 p-2 rounded-lg"
                role="radiogroup"
                aria-labelledby="mood-selector-label"
            >
                {Object.entries(moods).map(([moodKey, { emoji, color, label }]) => {
                    const isSelected = selectedMood === moodKey;
                    const baseClasses = "text-3xl p-3 rounded-full transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-700";
                    const selectedClasses = isSelected 
                        ? `bg-${color}-500/30 ring-2 ring-${color}-400 scale-110 shadow-lg` 
                        : 'opacity-50 hover:opacity-100 hover:scale-110';
                    
                    return (
                        <button
                            key={moodKey}
                            type="button"
                            onClick={() => onMoodChange(moodKey)}
                            onKeyDown={(e) => handleKeyDown(e, moodKey)}
                            className={`${baseClasses} ${selectedClasses}`}
                            aria-label={`Select ${label} mood`}
                            aria-pressed={isSelected}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={isSelected ? 0 : -1}
                        >
                            <span role="img" aria-label={label}>
                                {emoji}
                            </span>
                        </button>
                    );
                })}
            </div>
            {selectedMood && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                    Feeling {moods[selectedMood].label.toLowerCase()} today
                </p>
            )}
        </div>
    );
};

export default MoodSelector; 