import React, { useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine,
} from 'recharts';
import { fitCycleModel } from '../../../lib/cycleModel';
import { PHASES } from '../../../lib/cyclePattern';
import { getCreatedAtDate, toLocalDateKey } from '../../../lib/entryDates';
import { cn } from '../../../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';

const chartMuted = '#CDBBA3';
const chartGrid = '#2A2A36';
const RECENT_ENTRIES = 30; // how far back to look for entries that differ from the usual
const SHOWN_FLAGGED = 4;

const VERDICT = {
  'lower-than-usual': { label: 'Lower than usual for this point in your cycle', className: 'bg-[#D9909A]/10 text-[#D9909A]' },
  'higher-than-usual': { label: 'Higher than usual for this point in your cycle', className: 'bg-[#F0A35E]/10 text-[#F0A35E]' },
};

const phaseMeta = Object.fromEntries(PHASES.map((p) => [p.id, p]));

/** Contiguous runs of the same phase along the curve, for background bands. */
function phaseSpans(curve) {
  const spans = [];
  curve.forEach((c) => {
    const last = spans[spans.length - 1];
    if (last && last.phase === c.phase) last.x2 = c.cycleDay;
    else spans.push({ phase: c.phase, x1: c.cycleDay, x2: c.cycleDay });
  });
  return spans;
}

function RangeChart({ data, xKey, spans, markerX }) {
  const rows = data.map((d) => ({ ...d, band: [d.low, d.high] }));
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
          {(spans || []).map((s) => (
            <ReferenceArea key={`${s.phase}-${s.x1}`} x1={s.x1} x2={s.x2} fill={phaseMeta[s.phase]?.color} fillOpacity={0.1} stroke="none" />
          ))}
          <XAxis dataKey={xKey} stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} />
          <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} domain={[-10, 10]} />
          <Tooltip
            formatter={(value, name) => (name === 'band' ? [`${value[0]} to ${value[1]}`, 'Likely range'] : [value, 'Expected'])}
            labelFormatter={(label) => (xKey === 'cycleDay' ? `Cycle day ${label}` : label)}
            contentStyle={{ borderRadius: '12px', border: `1px solid ${chartGrid}` }}
          />
          <ReferenceLine y={0} stroke={chartGrid} />
          {markerX != null ? <ReferenceLine x={markerX} stroke="#D9909A" strokeDasharray="4 3" label={{ value: 'Today', fill: '#D9909A', fontSize: 11, position: 'top' }} /> : null}
          <Area type="monotone" dataKey="band" stroke="none" fill="#4A3C30" fillOpacity={0.25} isAnimationActive={false} />
          <Line type="monotone" dataKey="expected" stroke="#CDBBA3" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Reads the journal (sentiment of each entry) together with the period log and
 * shows the user's own cycle pattern, a forecast, and entries that differ from
 * what is usual for that point in their cycle. All computed in the browser.
 */
const CycleForecastCard = ({ entries, cyclePeriods }) => {
  const model = useMemo(() => fitCycleModel(entries, cyclePeriods), [entries, cyclePeriods]);

  const today = useMemo(() => (model.usable ? model.predict(toLocalDateKey(new Date())) : null), [model]);
  const forecast = useMemo(
    () => (model.usable ? model.forecast(14).map((p) => ({ ...p, label: p.dateKey.slice(5) })) : []),
    [model],
  );
  const flagged = useMemo(() => {
    if (!model.usable) return [];
    return [...entries]
      .sort((a, b) => (getCreatedAtDate(b)?.getTime() || 0) - (getCreatedAtDate(a)?.getTime() || 0))
      .slice(0, RECENT_ENTRIES)
      .map((e) => ({ entry: e, a: model.assess(e) }))
      .filter((x) => x.a && x.a.verdict !== 'typical')
      .slice(0, SHOWN_FLAGGED);
  }, [model, entries]);

  let body;
  if (model.status === 'not-enough-data') {
    body = (
      <p className="text-emote-muted text-emote-ink-faint">
        Not enough yet to learn your pattern: {model.n} of {model.needs.days} journaled days, across {model.cyclesUsed} of{' '}
        {model.needs.cycles} cycles. Keep journaling and logging periods, and this will appear on its own.
      </p>
    );
  } else if (model.status === 'no-reliable-pattern') {
    body = (
      <p className="text-emote-muted text-emote-ink-faint">
        Your mood doesn&apos;t follow a pattern across your cycle that we can rely on yet. When we tested predicting each
        cycle from the others, it did no better than just guessing your usual mood
        {model.cv ? ` (${model.cv.improvementPct}% change)` : ''}. That&apos;s a real answer, not an error; it may change
        as you log more cycles.
      </p>
    );
  } else if (model.usable) {
    const spans = phaseSpans(model.curve);
    body = (
      <div className="space-y-6">
        <div>
          <p className="mb-1 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">
            Your usual mood across a {model.stats.cycleLengthDays}-day cycle
          </p>
          <RangeChart data={model.curve} xKey="cycleDay" spans={spans} markerX={today?.cycleDay} />
          <div className="mt-2 flex flex-wrap gap-3 text-emote-caption text-emote-ink-soft">
            {PHASES.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color, opacity: 0.5 }} />
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Next 14 days</p>
          <RangeChart data={forecast} xKey="label" />
          {today ? (
            <p className="mt-2 text-emote-muted text-emote-ink-soft">
              Today is cycle day {today.cycleDay} ({phaseMeta[today.phase]?.label.toLowerCase()} phase); your mood is usually
              around {today.expected} (likely {today.low} to {today.high}).
            </p>
          ) : null}
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">
            Recent entries that differ from your usual
          </p>
          {flagged.length === 0 ? (
            <p className="text-emote-muted text-emote-ink-faint">
              Your recent entries are all in line with what&apos;s usual for where you were in your cycle.
            </p>
          ) : (
            <ul className="space-y-2">
              {flagged.map(({ entry, a }) => (
                <li key={entry.id || a.dateKey} className="flex flex-wrap items-center gap-2 text-emote-muted text-emote-ink-soft">
                  <span className="font-semibold text-emote-ink">{a.dateKey}</span>
                  <span>cycle day {a.cycleDay}</span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-emote-caption font-medium', VERDICT[a.verdict].className)}>
                    {VERDICT[a.verdict].label}
                  </span>
                  <span className="text-emote-ink-faint">
                    felt {a.actual}, usually about {a.expected}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-emote-caption text-emote-ink-faint">
          Learned from your own {model.n} journaled days over {model.cyclesUsed} cycles. On cycles it hadn&apos;t seen, it
          predicted your mood {model.cv.improvementPct}% better than guessing your average. A pattern to notice, not a
          diagnosis or medical advice.
        </p>
      </div>
    );
  } else {
    body = null;
  }

  if (!body) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your cycle pattern &amp; forecast</CardTitle>
        <CardDescription>
          Learned from your journal and your period log together, only for you. It stays in your browser and is never
          sent to an AI service.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
};

export default CycleForecastCard;
