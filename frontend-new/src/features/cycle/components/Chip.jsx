import React from 'react';
import { cn } from '../../../lib/utils';

/** Sharp-cornered toggle chip — Mood/Body selections, quick-action chips. Minimum 44px touch target. */
const Chip = ({ active, onClick, children, className }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'min-h-11 rounded-none border px-4 py-2 text-emote-muted font-semibold uppercase tracking-wider transition',
      active
        ? 'border-cycle-accent bg-cycle-accent text-cycle-accent-ink'
        : 'border-cycle-line bg-cycle-surface-2 text-cycle-text-2 hover:border-cycle-text-2/40',
      className,
    )}
  >
    {children}
  </button>
);

export default Chip;
