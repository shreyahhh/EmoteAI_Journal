import React from 'react';
import { motion } from 'framer-motion';
import { MOOD_KEYS, MOOD_EMOJIS, getMoodTagStyle } from '../../../lib/moodMeta';
import { Label } from '../../../components/ui/label';
import { cn } from '../../../lib/utils';

const MoodSelector = ({ selectedMood, onMoodChange }) => {
  return (
    <div>
      <Label className="mb-2">How are you feeling?</Label>
      <div className="flex justify-around rounded-lg bg-secondary p-2">
        {MOOD_KEYS.map((moodKey) => (
          <motion.button
            key={moodKey}
            type="button"
            whileHover={{ scale: 1.25 }}
            whileTap={{ scale: 1.1 }}
            onClick={() => onMoodChange(moodKey)}
            className={cn(
              'rounded-full p-2 text-3xl transition-opacity',
              selectedMood === moodKey ? cn(getMoodTagStyle(moodKey), 'ring-2') : 'text-emote-ink-faint opacity-50 hover:opacity-100',
            )}
            title={moodKey.charAt(0).toUpperCase() + moodKey.slice(1)}
          >
            {MOOD_EMOJIS[moodKey]}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
