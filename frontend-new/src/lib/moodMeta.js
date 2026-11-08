/** Single source of truth for mood/activity display metadata, shared across views. */

export const MOOD_KEYS = ['happy', 'sad', 'angry', 'anxious', 'neutral'];

// Matches the app's token palette (index.css): warm = lighter/positive,
// cool = heavier, destructive = anger, a soft violet (shared with the Cycle
// page's "luteal" phase color) for anxious, and muted ink for neutral — no
// stray greens or mustard outside that set.
export const MOOD_COLORS = {
  happy: '#F0A35E',
  sad: '#8FB3D9',
  angry: '#C2665A',
  anxious: '#A896D6',
  neutral: '#A8957D',
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
  happy: 'bg-[#F0A35E]/10 text-[#F0A35E] ring-[#F0A35E]/30',
  sad: 'bg-[#8FB3D9]/10 text-[#8FB3D9] ring-[#8FB3D9]/30',
  angry: 'bg-[#C2665A]/10 text-[#C2665A] ring-[#C2665A]/30',
  anxious: 'bg-[#A896D6]/10 text-[#A896D6] ring-[#A896D6]/30',
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
