import React from 'react';
import { cn } from '../../../lib/utils';

const Drop = ({ filled = true, size = 9 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden className="shrink-0">
    <path
      d="M5 0.5 C5 0.5 9 5.2 9 7.1 C9 9 7.2 9.8 5 9.8 C2.8 9.8 1 9 1 7.1 C1 5.2 5 0.5 5 0.5 Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1}
    />
  </svg>
);

export const FLOW_OPTIONS = [
  { id: 'none', label: 'None', drops: 0 },
  { id: 'spotting', label: 'Spotting', drops: 1, spotting: true },
  { id: 'light', label: 'Light', drops: 1 },
  { id: 'medium', label: 'Medium', drops: 2 },
  { id: 'heavy', label: 'Heavy', drops: 3 },
];

/** One-tap flow logging — 5 tiles, each with a small count of drop icons; the selected tile fills rose. */
const FlowPicker = ({ value, onChange, className }) => (
  <div className={cn('grid grid-cols-5 gap-2', className)}>
    {FLOW_OPTIONS.map((o) => {
      const active = o.id === value;
      return (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={active}
          className={cn(
            'flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-none border px-1 py-2.5 transition',
            active
              ? 'border-cycle-menstrual bg-cycle-menstrual text-cycle-menstrual-ink'
              : 'border-cycle-line bg-cycle-surface-2 text-cycle-text-2',
          )}
        >
          {o.drops === 0 ? (
            <span className="h-[9px] text-current">—</span>
          ) : (
            <span className="flex items-center gap-0.5 text-current">
              {Array.from({ length: o.drops }, (_, i) => (
                <Drop key={i} filled={!o.spotting} />
              ))}
            </span>
          )}
          <span className="text-emote-caption font-semibold uppercase tracking-wider">{o.label}</span>
        </button>
      );
    })}
  </div>
);

export default FlowPicker;
