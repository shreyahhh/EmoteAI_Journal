import React from 'react';
import { getPhaseSpans, getPhaseMeta } from '../models/cycleCalculations';

const STROKE = 14;

function polar(cx, cy, radius, dayIndex0, totalDays) {
  const angle = (dayIndex0 / totalDays) * 2 * Math.PI - Math.PI / 2;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

/**
 * The four-phase cycle ring: each phase drawn as its own arc, the current
 * phase at full opacity and the rest at 35% (never relying on color alone —
 * the today marker and phase name in the center are the shape-based tells).
 * `size` controls the rendered box; the stroke width and marker scale with it.
 */
const CycleRing = ({ cycleLength, periodLength, cycleDay, phase, size = 280, children }) => {
  const stroke = Math.max(8, Math.round((STROKE * size) / 280));
  const radius = size / 2 - stroke;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const spans = getPhaseSpans(cycleLength, periodLength);
  const marker = polar(cx, cy, radius, cycleDay - 1, cycleLength);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Day ${cycleDay} of about ${cycleLength}, ${phase} phase`}
      >
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {spans.map((s) => {
            const startLen = (circumference * (s.startDay - 1)) / cycleLength;
            const arcLen = (circumference * (s.endDay - s.startDay + 1)) / cycleLength - Math.max(2, stroke * 0.12);
            const meta = getPhaseMeta(s.phase);
            return (
              <circle
                key={s.phase}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={meta.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                opacity={s.phase === phase ? 1 : 0.35}
                strokeDasharray={`${Math.max(arcLen, 0)} ${circumference}`}
                strokeDashoffset={-startLen}
              />
            );
          })}
        </g>
        <circle cx={marker.x} cy={marker.y} r={Math.max(4, stroke * 0.4)} className="fill-cycle-text" stroke="#040407" strokeWidth={2} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
};

export default CycleRing;
