import { MOOD_KEYS, MOOD_EMOJIS, getMoodTagStyle } from '../lib/moodMeta';

const MoodSelector = ({ selectedMood, onMoodChange }) => {
    return (
        <div>
            <label className="block text-emote-ink-faint mb-2">How are you feeling?</label>
            <div className="flex justify-around bg-emote-surface-alt p-2 rounded-lg">
                {MOOD_KEYS.map((moodKey) => (
                    <button
                        key={moodKey}
                        type="button"
                        onClick={() => onMoodChange(moodKey)}
                        className={`text-3xl p-2 rounded-full transition-transform transform hover:scale-125 ${selectedMood === moodKey ? `${getMoodTagStyle(moodKey)} ring-2` : 'text-emote-ink-faint opacity-50 hover:opacity-100'}`}
                        title={moodKey.charAt(0).toUpperCase() + moodKey.slice(1)}
                    >
                        {MOOD_EMOJIS[moodKey]}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MoodSelector;
