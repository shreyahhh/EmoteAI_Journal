import React, { useMemo, useState } from 'react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import StatTile from '../../components/StatTile';
import { buildCycleHistory, buildMostLogged } from '../../models/cyclePatternStats';
import AdvancedForecastSection from './AdvancedForecastSection';
import DoctorReportModal from './DoctorReportModal';

const RANGES = [3, 6, 12];

const RangeSelector = ({ value, onChange }) => (
  <div className="flex rounded-none border border-cycle-line bg-cycle-surface-2 p-1">
    {RANGES.map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={cn(
          'min-h-9 flex-1 rounded-none px-3 text-emote-muted font-semibold uppercase tracking-wider transition',
          n === value ? 'bg-cycle-accent text-cycle-accent-ink' : 'text-cycle-text-2',
        )}
      >
        {n}
      </button>
    ))}
  </div>
);

const PatternsScreen = ({ entries, data, isDesktop }) => {
  const [range, setRange] = useState(6);
  const [reportOpen, setReportOpen] = useState(false);
  const { periods, dailyLogs, state } = data;

  const cycles = useMemo(() => buildCycleHistory(periods, range), [periods, range]);
  const mostLogged = useMemo(() => buildMostLogged(periods, dailyLogs, range), [periods, dailyLogs, range]);

  const totals = cycles.map((c) => c.totalLength);
  const avgCycle = totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : state.predictions?.avgCycleLength ?? 28;
  const avgPeriod = state.predictions?.avgPeriodLength ?? 5;
  const variation = totals.length >= 2 ? Math.max(...totals) - Math.min(...totals) : 0;
  const maxLength = Math.max(...totals, avgCycle, 1);

  return (
    <div className="px-1 pb-6 lg:px-8 lg:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-emote-section text-cycle-text">Patterns</h2>
        <RangeSelector value={range} onChange={setRange} />
      </div>
      <p className="mt-0.5 text-emote-caption text-cycle-faint">Last {range} cycles</p>

      <div className={cn('mt-4 grid gap-3', isDesktop ? 'grid-cols-2' : 'grid-cols-1')}>
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile value={avgCycle} unit="days" label="Average cycle" />
          <StatTile value={avgPeriod} unit="days" label="Average period" />
          <StatTile value={`±${variation}`} unit="days" label="Variation" />
        </div>

        <div className={cn(isDesktop && 'row-span-2')}>
          <div className="rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
            <p className="text-emote-muted font-semibold uppercase tracking-wider text-cycle-text">What you log most</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-emote-caption text-cycle-faint">On period days</p>
                <p className="text-emote-muted text-cycle-text-2">{mostLogged.onPeriodDays.join(' · ') || 'Not enough logged yet'}</p>
              </div>
              <div>
                <p className="text-emote-caption text-cycle-faint">The week before</p>
                <p className="text-emote-muted text-cycle-text-2">{mostLogged.weekBefore.join(' · ') || 'Not enough logged yet'}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-emote-muted font-semibold uppercase tracking-wider text-cycle-text">Cycle length</p>
          {cycles.length === 0 ? (
            <p className="text-emote-muted text-cycle-faint">Log a couple of periods to see your history here.</p>
          ) : (
            <div className="space-y-2">
              {cycles.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-emote-caption text-cycle-faint">{c.monthLabel}</span>
                  <div className="flex h-2.5 flex-1 overflow-hidden rounded-none bg-cycle-line">
                    {c.periodLength ? (
                      <div
                        className="h-full bg-cycle-menstrual"
                        style={{ width: `${Math.min(100, (c.periodLength / maxLength) * 100)}%` }}
                      />
                    ) : null}
                    <div className="h-full flex-1 bg-cycle-line-soft" style={{ width: `${Math.max(0, ((c.totalLength - (c.periodLength || 0)) / maxLength) * 100)}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right text-emote-caption text-cycle-text-2">{c.totalLength}d</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setReportOpen(true)}
        disabled={periods.length === 0}
        className="mt-5 min-h-[54px] w-full rounded-none border-cycle-line text-cycle-text lg:w-auto"
      >
        Create a report for your doctor
      </Button>

      <AdvancedForecastSection entries={entries} periods={periods} />

      <DoctorReportModal open={reportOpen} onOpenChange={setReportOpen} data={data} />
    </div>
  );
};

export default PatternsScreen;
