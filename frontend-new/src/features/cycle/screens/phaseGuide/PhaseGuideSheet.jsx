import React, { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { PHASES, getPhaseSpans } from '../../models/cycleCalculations';
import { buildPhaseJournalInsight } from '../../models/cycleJournalInsight';
import { cn } from '../../../../lib/utils';
import { BottomSheet } from '../../../../components/ui/sheet';

// Placeholder copy — the Figma file's 3.3 Phase guide screen carries the
// authored wording ("Copy for the four phases is in the Figma file"); this
// is a reasonable placeholder pending that pull, not final copy.
const COPY = {
  menstrual: {
    hormoneNote: 'Oestrogen and progesterone are at their lowest.',
    body: 'Bleeding, cramps, lower-back ache, tiredness, sometimes headaches or bloating.',
    mind: 'Feelings can sit closer to the surface. Many want more quiet and less socialising.',
    helps: 'Warmth, rest, gentle movement, iron-rich food, an earlier night.',
  },
  follicular: {
    hormoneNote: 'Oestrogen starts rising.',
    body: 'Energy usually returns. Skin often clearer, sleep steadier.',
    mind: 'Many notice better focus, more motivation, a brighter mood.',
    helps: "Starting new plans, harder workouts, social things you've been putting off.",
  },
  ovulatory: {
    hormoneNote: 'Oestrogen peaks and an egg is released.',
    body: 'Some feel a brief one-sided twinge or notice more discharge. Energy often at its highest.',
    mind: 'Often the most social, confident, talkative days of the cycle.',
    helps: 'Conversations, presenting, connecting with people.',
  },
  luteal: {
    hormoneNote: 'Progesterone rises, then both hormones fall.',
    body: 'Steady at first. In the last 5–7 days: bloating, tender breasts, cravings, poorer sleep.',
    mind: 'Irritability, worry or tearfulness can build before your period, then ease once it starts.',
    helps: 'Lighter plans, regular meals, movement, kindness to yourself.',
  },
};

const PhasePage = ({ phase, span, cycleDay, isCurrent, insight }) => (
  <div className="px-1">
    <span className="mb-2 block h-1.5 w-10 rounded-none" style={{ backgroundColor: phase.color }} aria-hidden />
    <h2 className="font-display text-emote-section" style={{ color: phase.color }}>{phase.label}</h2>
    <p className="mt-0.5 text-emote-muted text-cycle-faint">
      Days {span.startDay}–{span.endDay}
      {isCurrent ? ` · you're on day ${cycleDay}` : ''}
    </p>
    <p className="mt-2 text-emote-muted text-cycle-text-2">{COPY[phase.id].hormoneNote}</p>

    <div className="mt-4 space-y-3.5">
      <Block label="Body" text={COPY[phase.id].body} />
      <Block label="Mind" text={COPY[phase.id].mind} />
      <Block label="What helps" text={COPY[phase.id].helps} />
    </div>

    {insight ? (
      <div className="mt-4 rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
        <p className="text-emote-caption font-semibold uppercase tracking-wider text-cycle-accent">In your journal</p>
        <p className="mt-1 font-serif text-emote-muted leading-relaxed text-cycle-text-2">{insight.text}</p>
      </div>
    ) : null}
  </div>
);

const Block = ({ label, text }) => (
  <div>
    <p className="text-emote-caption font-semibold uppercase tracking-wider text-cycle-faint">{label}</p>
    <p className="mt-0.5 text-emote-muted leading-relaxed text-cycle-text-2">{text}</p>
  </div>
);

/** 3.3 Phase guide — four phase tabs, swipeable on mobile, a column row on desktop. */
const PhaseGuideSheet = ({ open, onOpenChange, currentPhase, cycleDay, cycleLength, periodLength, entries, stats, isDesktop }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open && currentPhase) {
      const i = PHASES.findIndex((p) => p.id === currentPhase);
      if (i >= 0) setIndex(i);
    }
  }, [open, currentPhase]);

  if (!cycleLength || !periodLength) return null;
  const spans = getPhaseSpans(cycleLength, periodLength);
  const spanFor = (id) => spans.find((s) => s.phase === id) || { startDay: 1, endDay: cycleLength };

  const content = isDesktop ? (
    <div className="grid grid-cols-4 gap-4">
      {PHASES.map((phase) => (
        <div key={phase.id} className={cn('rounded-none border p-4', phase.id === currentPhase ? 'border-cycle-text-2/30' : 'border-cycle-line')}>
          <PhasePage
            phase={phase}
            span={spanFor(phase.id)}
            cycleDay={cycleDay}
            isCurrent={phase.id === currentPhase}
            insight={buildPhaseJournalInsight(entries, stats, phase.id)}
          />
        </div>
      ))}
    </div>
  ) : (
    <div>
      <div className="mb-4 flex gap-1.5">
        {PHASES.map((phase, i) => (
          <button
            key={phase.id}
            type="button"
            onClick={() => setIndex(i)}
            className="h-1.5 flex-1 rounded-none"
            style={{ backgroundColor: phase.color, opacity: i === index ? 1 : 0.3 }}
            aria-label={phase.label}
          />
        ))}
      </div>
      <motion.div
        key={index}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 && index < PHASES.length - 1) setIndex(index + 1);
          else if (info.offset.x > 60 && index > 0) setIndex(index - 1);
        }}
      >
        <PhasePage
          phase={PHASES[index]}
          span={spanFor(PHASES[index].id)}
          cycleDay={cycleDay}
          isCurrent={PHASES[index].id === currentPhase}
          insight={buildPhaseJournalInsight(entries, stats, PHASES[index].id)}
        />
      </motion.div>
    </div>
  );

  const footer = (
    <p className="mt-5 border-t border-cycle-line pt-4 text-emote-caption text-cycle-faint">
      Common patterns, not rules. Everyone&rsquo;s cycle is different.
    </p>
  );

  if (isDesktop) {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="cycle-root relative max-h-[85vh] overflow-y-auto rounded-none border border-cycle-line bg-cycle-bg p-7 text-cycle-text shadow-xl focus:outline-none"
            >
              <h2 className="font-display text-emote-section font-semibold uppercase tracking-wider text-cycle-text">Phase guide</h2>
              <div className="mt-4">{content}</div>
              {footer}
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-none border border-cycle-line text-cycle-text-2 hover:bg-cycle-surface-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogPrimitive.Close>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} className="cycle-root bg-cycle-bg">
      {content}
      {footer}
    </BottomSheet>
  );
};

export default PhaseGuideSheet;
