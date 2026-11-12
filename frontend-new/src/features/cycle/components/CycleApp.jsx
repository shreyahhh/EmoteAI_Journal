import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Circle, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';
import { useIsNarrow } from '../../../lib/hooks/useIsNarrow';
import { cn } from '../../../lib/utils';
import { useCycleData } from '../hooks/useCycleData';
import SetupFlow from '../screens/setup/SetupFlow';
import TodayScreen from '../screens/today/TodayScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import PatternsScreen from '../screens/patterns/PatternsScreen';
import PhaseGuideSheet from '../screens/phaseGuide/PhaseGuideSheet';

const DESKTOP_BREAKPOINT = 1024;

const NAV_ITEMS = [
  { id: 'today', label: 'Today', Icon: Circle },
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'patterns', label: 'Patterns', Icon: BarChart3 },
];

function TabBarIcon({ Icon, active }) {
  return <Icon className={cn('h-5 w-5', active ? 'text-cycle-accent' : 'text-cycle-faint')} strokeWidth={active ? 2.25 : 1.75} />;
}

/**
 * Rendered via a portal straight onto document.body: AppShell wraps tab
 * content in a `motion.main` that applies a transform, and a `transform`
 * on any ancestor creates a new containing block for `position: fixed`
 * descendants — without the portal this bar would be "fixed" relative to
 * that animated div instead of the viewport, and could overlap/be
 * overlapped by later content instead of pinning to the screen's bottom.
 */
const MobileTabBar = ({ view, onSelect }) =>
  createPortal(
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-cycle-line bg-cycle-tabbar px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 lg:hidden"
      aria-label="Cycle sections"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.id === view;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="flex min-h-11 flex-1 flex-col items-center gap-0.5 rounded-none py-1.5"
            aria-current={active ? 'page' : undefined}
          >
            <TabBarIcon Icon={item.Icon} active={active} />
            <span className={cn('text-emote-muted font-semibold uppercase tracking-wider', active ? 'text-cycle-accent' : 'text-cycle-faint')}>{item.label}</span>
          </button>
        );
      })}
    </nav>,
    document.body,
  );

const DesktopRail = ({ view, onSelect }) => (
  <nav className="flex w-40 shrink-0 flex-col gap-1 pr-2 pt-1" aria-label="Cycle sections">
    {NAV_ITEMS.map((item) => {
      const active = item.id === view;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            'flex items-center gap-2.5 rounded-none px-3 py-2.5 text-left transition',
            active ? 'bg-cycle-surface-2 text-cycle-text' : 'text-cycle-faint hover:text-cycle-text-2',
          )}
          aria-current={active ? 'page' : undefined}
        >
          <TabBarIcon Icon={item.Icon} active={active} />
          <span className="text-emote-muted font-semibold uppercase tracking-wider">{item.label}</span>
        </button>
      );
    })}
  </nav>
);

/**
 * Cycle v2 — a self-contained mini-app living inside Emote's 'cycle' tab.
 * Owns its own header, its own Today/Calendar/Patterns navigation (bottom
 * tabs on mobile, a left rail at >=1024px), and its own data (useCycleData).
 * Settings live in Emote's main Settings modal, not here (see CLAUDE memory
 * / plan discussion — deliberately not a gear icon in this header).
 */
const CycleApp = ({ user, entries }) => {
  const [view, setView] = useState('today');
  const [phaseGuideOpen, setPhaseGuideOpen] = useState(false);
  const isDesktop = !useIsNarrow(DESKTOP_BREAKPOINT);
  const data = useCycleData(user);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
    [],
  );

  const needsSetup = !data.isLoading && !data.settings.userId && data.periods.length === 0;

  const screenProps = { user, entries, data };

  return (
    <div className="cycle-root -mx-4 -mt-16 min-h-[calc(100dvh-3.5rem)] bg-cycle-bg px-4 text-cycle-text sm:-mx-6 sm:px-6 lg:-mx-10 lg:mx-0 lg:-mt-8 lg:min-h-0 lg:rounded-none lg:border lg:border-cycle-line lg:px-0">
      {data.isLoading ? (
        <CycleLoadingSkeleton />
      ) : needsSetup ? (
        <SetupFlow data={data} onDone={() => setView('today')} />
      ) : (
        <>
          <header className="flex items-center justify-between gap-3 pb-4 pt-5 lg:px-8 lg:pt-7">
            <div>
              <p className="text-emote-caption text-cycle-faint">{dateLabel}</p>
              <h1 className="font-display text-emote-display leading-none text-cycle-text">Cycle</h1>
            </div>
          </header>

          <div className="lg:flex lg:gap-6 lg:px-8 lg:pb-8">
            {isDesktop ? <DesktopRail view={view} onSelect={setView} /> : null}
            <div className="min-w-0 flex-1 pb-24 lg:pb-0">
              {view === 'today' && <TodayScreen {...screenProps} isDesktop={isDesktop} onOpenPhaseGuide={() => setPhaseGuideOpen(true)} />}
              {view === 'calendar' && <CalendarScreen {...screenProps} isDesktop={isDesktop} />}
              {view === 'patterns' && <PatternsScreen {...screenProps} isDesktop={isDesktop} />}
            </div>
          </div>

          {!isDesktop ? <MobileTabBar view={view} onSelect={setView} /> : null}

          <PhaseGuideSheet
            open={phaseGuideOpen}
            onOpenChange={setPhaseGuideOpen}
            currentPhase={data.state.today?.phase}
            cycleDay={data.state.today?.cycleDay}
            cycleLength={data.state.predictions?.avgCycleLength}
            periodLength={data.state.predictions?.avgPeriodLength}
            entries={entries}
            stats={data.state.stats}
            isDesktop={isDesktop}
          />
        </>
      )}
    </div>
  );
};

const CycleLoadingSkeleton = () => (
  <div className="cycle-root -mx-4 -mt-16 min-h-[calc(100dvh-3.5rem)] animate-pulse bg-cycle-bg px-4 pt-5 sm:-mx-6 sm:px-6 lg:-mx-10 lg:mx-0 lg:-mt-8 lg:min-h-0 lg:rounded-none lg:border lg:border-cycle-line lg:px-8 lg:pt-7">
    <div className="h-4 w-32 rounded-none bg-cycle-surface-2" />
    <div className="mt-2 h-8 w-24 rounded-none bg-cycle-surface-2" />
    {/* Stands in for the circular CycleRing below — kept round to match what it previews. */}
    <div className="mx-auto mt-10 h-64 w-64 rounded-full bg-cycle-surface-2" />
    <div className="mt-8 h-12 rounded-none bg-cycle-surface-2" />
    <div className="mt-3 h-12 rounded-none bg-cycle-surface-2" />
  </div>
);

export default CycleApp;
