import React, { useMemo, useState } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { fitCycleModel } from '../../models/cycleModel';
import { toLocalDateKey } from '../../../../lib/models/entryDates';
import { cn } from '../../../../lib/utils';

const gridColor = '#2A2A36';
const mutedColor = '#A8957D';

// cycleModel.js's own phase ids ('ovulation') predate the v2 redesign's
// ('ovulatory') — map just for color lookup here, the model itself is
// unaffected since its phase label is never shown to the user.
const PHASE_COLOR = { menstrual: '#D9909A', follicular: '#9CC3A6', ovulation: '#F0B866', luteal: '#B7A6DE' };

function RangeChart({ data, xKey }) {
  const rows = data.map((d) => ({ ...d, band: [d.low, d.high] }));
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey={xKey} stroke={mutedColor} tick={{ fill: mutedColor, fontSize: 10 }} />
          <YAxis stroke={mutedColor} tick={{ fill: mutedColor, fontSize: 10 }} domain={[-10, 10]} />
          <Tooltip
            formatter={(value, name) => (name === 'band' ? [`${value[0]} to ${value[1]}`, 'Likely range'] : [value, 'Expected'])}
            contentStyle={{ borderRadius: '0px', border: `1px solid ${gridColor}`, background: '#101016', color: '#F2E6D4' }}
          />
          <ReferenceLine y={0} stroke={gridColor} />
          <Area type="monotone" dataKey="band" stroke="none" fill="#1C1C25" fillOpacity={0.6} isAnimationActive={false} />
          <Line type="monotone" dataKey="expected" stroke="#CDBBA3" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * The mood-forecast curve kept from the previous Cycle build (per decision
 * to preserve it) — tucked away as an optional "Advanced" section since it's
 * not part of the Cycle v2 spec's own screens.
 */
const AdvancedForecastSection = ({ entries, periods }) => {
  const [open, setOpen] = useState(false);
  const model = useMemo(() => fitCycleModel(entries, periods), [entries, periods]);
  const today = useMemo(() => (model.usable ? model.predict(toLocalDateKey(new Date())) : null), [model]);
  const forecast = useMemo(() => (model.usable ? model.forecast(14).map((p) => ({ ...p, label: p.dateKey.slice(5) })) : []), [model]);

  if (model.status === 'no-periods' || model.status === 'not-enough-data') return null;

  return (
    <div className="mt-5 border-t border-cycle-line pt-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-h-11 w-full items-center justify-between text-left">
        <span className="text-emote-muted font-semibold uppercase tracking-wider text-cycle-text-2">Advanced: your mood forecast</span>
        <ChevronDown className={cn('h-4 w-4 text-cycle-faint transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="mt-3 space-y-4">
          {model.status === 'no-reliable-pattern' ? (
            <p className="text-emote-muted text-cycle-faint">
              Your mood doesn&rsquo;t follow a pattern across your cycle that we can rely on yet
              {model.cv ? ` (${model.cv.improvementPct}% change vs. guessing your average)` : ''}. That&rsquo;s a real
              answer, not an error.
            </p>
          ) : (
            <>
              <RangeChart data={forecast} xKey="label" />
              {today ? (
                <p className="text-emote-muted text-cycle-text-2">
                  Today your mood is usually around {today.expected} (likely {today.low} to {today.high}),{' '}
                  <span style={{ color: PHASE_COLOR[today.phase] }}>{today.phase}</span> phase.
                </p>
              ) : null}
              <p className="text-emote-caption text-cycle-faint">
                Learned from your own journal and period log, entirely in your browser. A pattern to notice, not a
                diagnosis.
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default AdvancedForecastSection;
