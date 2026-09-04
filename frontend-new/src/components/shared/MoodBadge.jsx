import React from 'react';
import { Badge } from '../ui/badge';
import { getMoodEmoji, getMoodTagStyle } from '../../lib/moodMeta';
import { cn } from '../../lib/utils';

/** Mood-keyed badge — colors come from lib/moodMeta so every mood tag in the
 * app (timeline, entry cards, entries list) stays visually consistent. */
export default function MoodBadge({ mood, showEmoji = false, className, ...props }) {
  const label = (mood || 'neutral').toLowerCase();
  return (
    <Badge className={cn(getMoodTagStyle(label), className)} {...props}>
      {showEmoji ? <span className="mr-1">{getMoodEmoji(label)}</span> : null}
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </Badge>
  );
}
