import React from 'react';
import { cn } from '../../../lib/utils';

const StatTile = ({ value, unit, label, className }) => (
  <div className={cn('rounded-none border border-cycle-line bg-cycle-surface-2 px-3 py-3.5 text-center', className)}>
    <p className="font-display leading-none text-cycle-text">
      <span className="text-emote-section">{value}</span>
      {unit ? <span className="ml-1 text-emote-body text-cycle-text-2">{unit}</span> : null}
    </p>
    <p className="mt-1 text-emote-caption font-semibold uppercase tracking-wider text-cycle-faint">{label}</p>
  </div>
);

export default StatTile;
