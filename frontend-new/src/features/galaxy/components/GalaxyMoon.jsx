import React from 'react';

/** Lit if the goal has any completion in the current 7-day window (PRD section 15: "light up when completed"). */
function isLitThisWeek(completions) {
  if (!completions) return false;
  const now = Date.now();
  return Object.entries(completions).some(([dateKey, done]) => {
    if (!done) return false;
    const diffDays = (now - new Date(dateKey).getTime()) / 86400000;
    return diffDays >= 0 && diffDays < 7;
  });
}

/** Small moon chip for a goal tagged to a planet; lights up when recently completed. */
export default function GalaxyMoon({ goal }) {
  const lit = isLitThisWeek(goal.completions);
  return (
    <span
      title={goal.title}
      className={`inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1 text-emote-caption transition ${
        lit ? 'border-emote-accent bg-emote-accent/10 text-emote-accent' : 'border-border text-emote-ink-faint'
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${lit ? 'bg-emote-accent' : 'bg-emote-ink-faint'}`} aria-hidden />
      {goal.title}
    </span>
  );
}
