/** Single source of truth for mood/activity display metadata, shared across views. */

export const MOOD_KEYS = ['happy', 'sad', 'angry', 'anxious', 'neutral'];

export const MOOD_COLORS = {
  happy: '#3f8f5f',
  sad: '#5b7a9c',
  angry: '#a8432f',
  anxious: '#c98a1f',
  neutral: '#a68a63',
};

export function getMoodColor(mood) {
  return MOOD_COLORS[mood] || MOOD_COLORS.neutral;
}

export const MOOD_EMOJIS = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  anxious: '😟',
  neutral: '😐',
};

export function getMoodEmoji(mood) {
  return MOOD_EMOJIS[mood] || MOOD_EMOJIS.neutral;
}

export const MOOD_TAG_STYLES = {
  happy: 'bg-[#3f8f5f]/10 text-[#3f8f5f] ring-[#3f8f5f]/30',
  sad: 'bg-[#5b7a9c]/10 text-[#5b7a9c] ring-[#5b7a9c]/30',
  angry: 'bg-[#a8432f]/10 text-[#a8432f] ring-[#a8432f]/30',
  anxious: 'bg-[#c98a1f]/10 text-[#c98a1f] ring-[#c98a1f]/30',
  neutral: 'bg-emote-surface-alt text-emote-ink-soft ring-emote-border',
};

export function getMoodTagStyle(mood) {
  return MOOD_TAG_STYLES[mood] || MOOD_TAG_STYLES.neutral;
}

/** Activity keys used by the journal composer, insights charts, and history. */
export const ACTIVITY_OPTIONS = [
  { key: 'exercise', label: 'Exercise' },
  { key: 'work', label: 'Work' },
  { key: 'social', label: 'Social' },
  { key: 'hobby', label: 'Hobby' },
  { key: 'rest', label: 'Rest' },
  { key: 'family', label: 'Family' },
  { key: 'chores', label: 'Chores' },
  { key: 'nature', label: 'Nature' },
];

export const ACTIVITY_LABELS = ACTIVITY_OPTIONS.reduce((acc, { key, label }) => {
  acc[key] = label;
  return acc;
}, {});

/** Display names used when charting "which activities show up on happy days". */
export const ACTIVITY_CHART_NAMES = {
  exercise: 'Exercise',
  work: 'Work',
  social: 'Socialized',
  hobby: 'Hobby',
  rest: 'Rested',
  family: 'Family Time',
  chores: 'Chores',
  nature: 'Nature',
};
