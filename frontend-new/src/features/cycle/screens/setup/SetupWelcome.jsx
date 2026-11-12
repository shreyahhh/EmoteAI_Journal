import React from 'react';
import { PHASES } from '../../models/cycleCalculations';
import { Button } from '../../../../components/ui/button';

const RingIllustration = () => {
  const size = 120;
  const stroke = 12;
  const r = size / 2 - stroke;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const seg = circumference / 4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <g transform={`rotate(-90 ${c} ${c})`}>
        {PHASES.map((p, i) => (
          <circle
            key={p.id}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={p.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${seg - 3} ${circumference}`}
            strokeDashoffset={-(seg * i)}
          />
        ))}
      </g>
    </svg>
  );
};

const PROMISES = [
  'Private to you. Never shared, never used for ads.',
  'Rough answers are fine — predictions improve as you log.',
  'Not medical advice, and not a method of contraception.',
];

const SetupWelcome = ({ onStart, onSkip }) => (
  <div className="flex flex-col items-center px-1 pb-8 pt-10 text-center lg:mx-auto lg:max-w-[560px] lg:flex-row lg:gap-10 lg:px-8 lg:pt-16 lg:text-left">
    <div className="shrink-0">
      <RingIllustration />
      <p className="mt-2 font-display text-emote-body italic text-cycle-text-2 lg:text-center">your rhythm</p>
    </div>
    <div className="mt-6 lg:mt-0">
      <h1 className="font-display text-emote-display leading-tight text-cycle-text">
        Know your rhythm, not just your dates.
      </h1>
      <ul className="mt-5 space-y-2.5 text-left">
        {PROMISES.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-emote-muted text-cycle-text-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cycle-accent" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row lg:justify-start">
        <Button type="button" onClick={onStart} className="min-h-[54px] rounded-none bg-cycle-accent px-7 text-cycle-accent-ink hover:brightness-110">
          Set up in 2 steps
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          className="min-h-[54px] rounded-none border border-cycle-line px-7 text-cycle-text-2 hover:bg-cycle-surface-2"
        >
          Not now
        </Button>
      </div>
    </div>
  </div>
);

export default SetupWelcome;
