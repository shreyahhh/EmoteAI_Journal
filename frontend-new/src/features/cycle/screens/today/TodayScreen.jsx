import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { BottomSheet } from '../../../../components/ui/sheet';
import { Button } from '../../../../components/ui/button';
import {
  formatRelativeDays,
  getPhaseMeta,
  PREDICTION_DISCLAIMER,
  addDays,
} from '../../models/cycleCalculations';
import { buildPhaseJournalInsight } from '../../models/cycleJournalInsight';
import CycleRing from '../../components/CycleRing';
import FlowPicker from '../../components/FlowPicker';
import LogSheetContent from './LogSheetContent';

function formatDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

const RingCenter = ({ cycleDay, phase, inPeriod }) => {
  const meta = getPhaseMeta(phase);
  return (
    <>
      <p className="text-emote-caption uppercase tracking-wider text-cycle-faint">Day</p>
      <p className="font-display text-[3.2rem] leading-none text-cycle-text">{cycleDay}</p>
      <p className="mt-1 text-emote-body font-medium" style={{ color: inPeriod ? '#D9909A' : meta?.color }}>
        {inPeriod ? 'Period' : meta?.label}
      </p>
    </>
  );
};

const Tiles = ({ predictions, onOpenPhaseGuide, todayKey, phase }) => {
  const meta = getPhaseMeta(phase);
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
        <p className="text-emote-caption text-cycle-faint">Next period</p>
        <p className="mt-1 text-emote-body font-medium text-cycle-text">
          {predictions.isIrregular && predictions.nextPeriodRange
            ? `~${formatDate(predictions.nextPeriodRange.startKey)}–${formatDate(predictions.nextPeriodRange.endKey)}`
            : `~${formatDate(predictions.nextPeriodStartKey)}`}
        </p>
        <p className="text-emote-caption text-cycle-faint">{formatRelativeDays(predictions.nextPeriodStartKey, todayKey)}</p>
      </div>
      <button
        type="button"
        onClick={onOpenPhaseGuide}
        className="rounded-none border border-cycle-line bg-cycle-surface-2 p-4 text-left transition hover:border-cycle-text-2/40"
      >
        <p className="text-emote-caption text-cycle-faint">This phase</p>
        <p className="mt-1 flex items-center gap-1 text-emote-body font-medium" style={{ color: meta?.color }}>
          {meta?.label}
        </p>
        <p className="flex items-center gap-1 text-emote-caption text-cycle-faint">
          What to expect <ArrowRight className="h-3 w-3" />
        </p>
      </button>
    </div>
  );
};

const JournalInsightCard = ({ insight }) => {
  if (!insight) return null;
  return (
    <div className="mt-4 rounded-none border border-cycle-luteal/50 bg-cycle-surface-2 p-4">
      <p className="text-emote-caption font-semibold uppercase tracking-wider text-cycle-luteal">From your journal</p>
      <p className="mt-1.5 font-serif text-emote-body leading-relaxed text-cycle-text-2">{insight.text}</p>
    </div>
  );
};

const LatePeriodBanner = ({ onLogIt }) => (
  <div className="mt-4 rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
    <p className="text-emote-muted text-cycle-text-2">Your period is later than usual. Log it if it&rsquo;s started.</p>
    <Button type="button" variant="outline" size="sm" onClick={onLogIt} className="mt-2.5 rounded-none border-cycle-line text-cycle-text">
      My period started
    </Button>
  </div>
);

const PeriodEndBanner = ({ onYes, onStillGoing }) => (
  <div className="mt-4 rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
    <p className="text-emote-muted text-cycle-text-2">Has your period ended?</p>
    <div className="mt-2.5 flex gap-2">
      <Button type="button" size="sm" onClick={onYes} className="rounded-none bg-cycle-accent text-cycle-accent-ink">
        Yes, it ended
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onStillGoing} className="rounded-none border-cycle-line text-cycle-text">
        Still going
      </Button>
    </div>
  </div>
);

const TodayEmptyState = ({ onLogPeriodStart }) => (
  <div className="flex flex-col items-center px-4 py-14 text-center">
    <div className="h-40 w-40 rounded-full border-4 border-dashed border-cycle-line" aria-hidden />
    <h2 className="mt-6 font-display text-emote-section text-cycle-text">No cycle logged yet</h2>
    <p className="mt-1.5 max-w-xs text-emote-muted text-cycle-faint">
      Log your first period and Cycle will start showing your phase and predictions here.
    </p>
    <Button type="button" onClick={onLogPeriodStart} className="mt-5 min-h-[54px] rounded-none bg-cycle-accent px-7 text-cycle-accent-ink">
      My period started today
    </Button>
  </div>
);

/**
 * Today — switches between three states (2.1 default, 2.3 after logging,
 * 2.4 during a period) and two layouts (mobile: sheet-based logging;
 * desktop: the log panel inline, per the responsive spec in section 7).
 */
const TodayScreen = ({ entries, data, isDesktop, onOpenPhaseGuide }) => {
  const { state, todayKey, getLogFor, saveDailyLog, startPeriodToday, endPeriod } = data;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(() => getLogFor(todayKey));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [dismissedEndPrompt, setDismissedEndPrompt] = useState(false);

  useEffect(() => {
    setDraft(getLogFor(todayKey));
  }, [getLogFor, todayKey]);

  if (!state.hasData) {
    return <TodayEmptyState onLogPeriodStart={() => startPeriodToday()} />;
  }

  const { today, predictions } = state;
  const inPeriod = Boolean(predictions.currentPeriod);
  const storedLog = getLogFor(todayKey);
  const hasLoggedToday = Boolean(
    (storedLog.flow && storedLog.flow !== 'none') ||
      (storedLog.pain && storedLog.pain !== 'none') ||
      storedLog.mood.length ||
      storedLog.symptoms.length ||
      storedLog.sleep ||
      storedLog.cravings.length ||
      (storedLog.discharge && storedLog.discharge !== 'none') ||
      storedLog.products.length,
  );
  const insight = buildPhaseJournalInsight(entries, state.stats, today.phase);

  const handleDraftChange = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await saveDailyLog(todayKey, draft);
    setSaving(false);
    if (!error) {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1600);
      if (!isDesktop) setSheetOpen(false);
    }
  };

  const handleInlineFlowTap = async (flow) => {
    setDraft((prev) => ({ ...prev, flow }));
    await saveDailyLog(todayKey, { flow });
  };

  const context = contextLine(predictions, inPeriod);

  const ring = (
    <CycleRing cycleLength={predictions.avgCycleLength} periodLength={predictions.avgPeriodLength} cycleDay={today.cycleDay} phase={today.phase} size={isDesktop ? 300 : 280}>
      <RingCenter cycleDay={today.cycleDay} phase={today.phase} inPeriod={inPeriod} />
    </CycleRing>
  );

  const left = (
    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
      {ring}
      <p className="mt-4 max-w-[260px] text-emote-muted text-cycle-text-2 lg:max-w-none">{context}</p>

      {predictions.periodEndPrompt && !dismissedEndPrompt ? (
        <PeriodEndBanner
          onYes={() => endPeriod(predictions.currentPeriod.id)}
          onStillGoing={() => setDismissedEndPrompt(true)}
        />
      ) : predictions.latePeriodPrompt ? (
        <LatePeriodBanner onLogIt={() => startPeriodToday()} />
      ) : null}

      {inPeriod ? (
        <div className="mt-4 w-full max-w-sm lg:max-w-none">
          <p className="mb-2 text-emote-muted font-medium text-cycle-text-2">How&rsquo;s your flow today?</p>
          <FlowPicker value={draft.flow} onChange={handleInlineFlowTap} />
          {!isDesktop ? (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="mt-3 min-h-11 text-emote-muted font-semibold uppercase tracking-wider text-cycle-accent"
            >
              Add pain, mood or symptoms
            </button>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-none border border-cycle-line bg-cycle-surface-2 p-3.5">
              <p className="text-emote-caption text-cycle-faint">Started</p>
              <p className="text-emote-muted font-medium text-cycle-menstrual">{formatDate(predictions.currentPeriod.startDate)}</p>
              <p className="text-emote-caption text-cycle-faint">{formatRelativeDays(predictions.currentPeriod.startDate, todayKey)}</p>
            </div>
            <div className="rounded-none border border-cycle-line bg-cycle-surface-2 p-3.5">
              <p className="text-emote-caption text-cycle-faint">Usually lasts</p>
              <p className="text-emote-muted font-medium text-cycle-text">{predictions.avgPeriodLength} days</p>
              <p className="text-emote-caption text-cycle-faint">
                ends ~{formatDate(addDays(predictions.currentPeriod.startDate, predictions.avgPeriodLength - 1))}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => endPeriod(predictions.currentPeriod.id)}
            className="mt-3 min-h-[54px] w-full rounded-none border-cycle-line text-cycle-text"
          >
            My period ended
          </Button>
        </div>
      ) : !isDesktop ? (
        <div className="mt-5 flex w-full max-w-sm flex-col gap-2.5">
          <Button type="button" onClick={() => setSheetOpen(true)} className="min-h-[54px] rounded-none bg-cycle-accent text-cycle-accent-ink hover:brightness-110">
            Log today
          </Button>
          <Button type="button" variant="outline" onClick={() => startPeriodToday()} className="min-h-[54px] rounded-none border-cycle-line text-cycle-text">
            My period started
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => startPeriodToday()} className="mt-5 min-h-[54px] w-full max-w-sm rounded-none border-cycle-line text-cycle-text">
          My period started
        </Button>
      )}

      {!inPeriod ? (
        <div className="w-full max-w-sm lg:max-w-none">
          <Tiles predictions={predictions} onOpenPhaseGuide={onOpenPhaseGuide} todayKey={todayKey} phase={today.phase} />
          {hasLoggedToday ? <LoggedSummaryCard log={storedLog} onEdit={() => setSheetOpen(true)} /> : null}
          <JournalInsightCard insight={insight} />
        </div>
      ) : null}

      <p className="mt-5 text-emote-caption text-cycle-faint">{PREDICTION_DISCLAIMER}</p>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="grid grid-cols-[320px_1fr] gap-10 px-8 pb-8">
        {left}
        <div className="rounded-none border border-cycle-line bg-cycle-surface-2 p-5">
          <LogSheetContent
            log={draft}
            onChange={handleDraftChange}
            onSave={handleSave}
            saving={saving}
            saved={justSaved}
            hideFlow={inPeriod}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-1">
      {left}
      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <LogSheetContent
          log={draft}
          onChange={handleDraftChange}
          onSave={handleSave}
          onCancel={() => setSheetOpen(false)}
          saving={saving}
          saved={justSaved}
          hideFlow={inPeriod}
        />
      </BottomSheet>
    </div>
  );
};

function contextLine(predictions, inPeriod) {
  if (inPeriod) return null;
  if (predictions.latePeriodPrompt) return "Your period hasn't started yet — it's running a bit later than usual.";
  if (predictions.isIrregular) return 'Your cycle varies, so this is a loose estimate.';
  const days = predictions.daysUntilNextPeriod;
  if (days <= 0) return 'Your period may start any day now.';
  if (days === 1) return 'Your period may start tomorrow.';
  return `Your period may start in about ${days} days.`;
}

const LABELS = {
  spotting: 'Spotting', light: 'Light flow', medium: 'Medium flow', heavy: 'Heavy flow',
  mild: 'Mild pain', moderate: 'Moderate pain', severe: 'Severe pain',
  calm: 'Calm', sensitive: 'Sensitive', irritable: 'Irritable', anxious: 'Anxious', low: 'Low', energetic: 'Energetic',
  cramps: 'Cramps', bloating: 'Bloating', tender_breasts: 'Tender breasts', headache: 'Headache', back_pain: 'Back pain', acne: 'Acne',
};

function summaryChips(log) {
  const chips = [];
  if (log.flow && log.flow !== 'none') chips.push(LABELS[log.flow] || log.flow);
  if (log.pain && log.pain !== 'none') chips.push(LABELS[log.pain] || log.pain);
  log.mood.forEach((m) => chips.push(LABELS[m] || m));
  log.symptoms.forEach((s) => chips.push(LABELS[s] || s));
  return chips;
}

const LoggedSummaryCard = ({ log, onEdit }) => {
  const chips = summaryChips(log);
  const shown = chips.slice(0, 4);
  const rest = chips.length - shown.length;
  return (
    <div className="mt-4 rounded-none border border-cycle-line bg-cycle-surface-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-emote-muted font-medium text-cycle-text">Logged today</p>
        <button type="button" onClick={onEdit} className="min-h-11 px-2 text-emote-muted font-semibold uppercase tracking-wider text-cycle-accent">
          Edit
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {shown.map((c) => (
          <span key={c} className="rounded-none border border-cycle-line px-3 py-1 text-emote-caption font-medium uppercase tracking-wider text-cycle-text-2">
            {c}
          </span>
        ))}
        {rest > 0 ? <span className="rounded-none border border-cycle-line px-3 py-1 text-emote-caption font-medium uppercase tracking-wider text-cycle-faint">+{rest}</span> : null}
      </div>
    </div>
  );
};

export default TodayScreen;
