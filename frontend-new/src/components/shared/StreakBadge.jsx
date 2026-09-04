import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Small chip showing the current journaling streak; hidden until there is one to show.
 * Keying the inner span on `current` re-triggers its pop-in animation whenever the
 * count changes (e.g. right after a save pushes the streak up by a day). */
export default function StreakBadge({ current, longest, activeToday, className }) {
  if (!current) return null;
  const title = activeToday
    ? `${current}-day streak — you've journaled today. Longest streak: ${longest} day${longest === 1 ? '' : 's'}.`
    : `${current}-day streak — write today to keep it going. Longest streak: ${longest} day${longest === 1 ? '' : 's'}.`;

  return (
    <span
      title={title}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full bg-emote-gold/15 px-3 py-1 text-emote-caption font-semibold text-emote-accent-2 ring-1 ring-inset ring-emote-gold/40',
        !activeToday && 'opacity-70',
        className,
      )}
    >
      <motion.span
        key={current}
        initial={{ scale: 0.4, opacity: 0, y: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="flex items-center gap-1.5"
      >
        <Flame className="h-3.5 w-3.5" aria-hidden />
        {current} day{current === 1 ? '' : 's'}
      </motion.span>
    </span>
  );
}
