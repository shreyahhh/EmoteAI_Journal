import React from 'react';
import { cn } from '../../../lib/utils';

/** Connected single-select row (used for Pain: None/Mild/Moderate/Severe). */
const SegmentedControl = ({ options, value, onChange, className }) => (
  <div className={cn('flex rounded-none border border-cycle-line bg-cycle-surface-2 p-1', className)} role="radiogroup">
    {options.map((o) => {
      const active = o.id === value;
      return (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(o.id)}
          className={cn(
            'min-h-10 flex-1 rounded-none px-3 py-1.5 text-emote-muted font-semibold uppercase tracking-wider transition',
            active ? 'bg-cycle-accent text-cycle-accent-ink' : 'text-cycle-text-2 hover:text-cycle-text',
          )}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
