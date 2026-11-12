import {
  computeCycleStats,
  getCycleDayAndPhase,
  computePredictions,
  computeCycleState,
  formatRelativeDays,
  addDays,
  getPhaseSpans,
} from './cycleCalculations';

// Three clean 28-day cycles, 5-day periods, starting 2026-01-01.
const REGULAR_PERIODS = [
  { startDate: '2026-01-01', endDate: '2026-01-05' },
  { startDate: '2026-01-29', endDate: '2026-02-02' },
  { startDate: '2026-02-26', endDate: '2026-03-02' },
];

describe('computeCycleStats', () => {
  test('falls back to setup values with no completed cycles or closed periods yet', () => {
    const stats = computeCycleStats([{ startDate: '2026-01-01', endDate: null }], {
      avgCycleLength: 30,
      avgPeriodLength: 6,
    });
    expect(stats.hasRealCycleData).toBe(false);
    expect(stats.avgCycleLength).toBe(30);
    expect(stats.avgPeriodLength).toBe(6);
  });

  test('a single closed period is still enough to average a real period length', () => {
    const stats = computeCycleStats([{ startDate: '2026-01-01', endDate: '2026-01-05' }], {
      avgPeriodLength: 6,
    });
    expect(stats.avgPeriodLength).toBe(5);
  });

  test('averages the last up-to-6 completed cycles once 2+ exist', () => {
    const stats = computeCycleStats(REGULAR_PERIODS, { avgCycleLength: 30, avgPeriodLength: 6 });
    expect(stats.hasRealCycleData).toBe(true);
    expect(stats.avgCycleLength).toBe(28);
    expect(stats.avgPeriodLength).toBe(5);
    expect(stats.variationDays).toBe(0);
    expect(stats.isIrregular).toBe(false);
  });

  test('flags irregular when variation exceeds 7 days, even without the manual flag', () => {
    const periods = [
      { startDate: '2026-01-01', endDate: '2026-01-05' },
      { startDate: '2026-01-22', endDate: '2026-01-26' }, // 21-day cycle
      { startDate: '2026-02-23', endDate: '2026-02-27' }, // 32-day cycle -> variation 11
    ];
    const stats = computeCycleStats(periods, {});
    expect(stats.variationDays).toBe(11);
    expect(stats.isIrregular).toBe(true);
  });

  test('the manual irregular flag forces irregular mode regardless of variation', () => {
    const stats = computeCycleStats(REGULAR_PERIODS, { irregular: true });
    expect(stats.variationDays).toBe(0);
    expect(stats.isIrregular).toBe(true);
  });

  test('ignores an implausible gap (e.g. a mis-logged duplicate) when averaging', () => {
    const periods = [
      { startDate: '2026-01-01', endDate: '2026-01-05' },
      { startDate: '2026-01-29', endDate: '2026-02-02' },
      { startDate: '2026-02-26', endDate: '2026-03-02' },
      { startDate: '2026-02-27', endDate: '2026-03-02' }, // 1-day gap, not a real cycle
    ];
    const stats = computeCycleStats(periods, {});
    expect(stats.avgCycleLength).toBe(28);
  });
});

describe('getCycleDayAndPhase', () => {
  const stats = computeCycleStats(REGULAR_PERIODS, {});

  test.each([
    ['2026-01-01', 1, 'menstrual'],
    ['2026-01-05', 5, 'menstrual'],
    ['2026-01-06', 6, 'follicular'],
    ['2026-01-12', 12, 'follicular'],
    ['2026-01-13', 13, 'ovulatory'], // ovulation day = 28 - 14 = 14, radius 1 -> starts day 13
    ['2026-01-14', 14, 'ovulatory'],
    ['2026-01-15', 15, 'ovulatory'],
    ['2026-01-16', 16, 'luteal'],
    ['2026-01-28', 28, 'luteal'],
    ['2026-01-29', 1, 'menstrual'], // next period anchors a fresh cycle day 1
  ])('%s is cycle day %i, phase %s', (dateKey, expectedDay, expectedPhase) => {
    const result = getCycleDayAndPhase(dateKey, stats, '2026-01-29');
    expect(result.cycleDay).toBe(expectedDay);
    expect(result.phase).toBe(expectedPhase);
  });

  test('returns null before any logged period', () => {
    expect(getCycleDayAndPhase('2025-12-01', stats, '2025-12-01')).toBeNull();
  });

  test('an ongoing (unclosed) period counts today as still menstrual', () => {
    const ongoing = computeCycleStats([{ startDate: '2026-01-01', endDate: null }], {});
    const result = getCycleDayAndPhase('2026-01-03', ongoing, '2026-01-03');
    expect(result.phase).toBe('menstrual');
  });
});

describe('computePredictions', () => {
  test('predicts the next period 28 days after the latest start, with ovulation 14 days before it', () => {
    const stats = computeCycleStats(REGULAR_PERIODS, {});
    const predictions = computePredictions(REGULAR_PERIODS, stats, '2026-03-05');
    expect(predictions.nextPeriodStartKey).toBe('2026-03-26');
    expect(predictions.ovulationDateKey).toBe('2026-03-12');
    expect(predictions.fertileWindow).toEqual({ startKey: '2026-03-07', endKey: '2026-03-13' });
    expect(predictions.pmsWindow).toEqual({ startKey: '2026-03-21', endKey: '2026-03-25' });
  });

  test('hides the ovulation estimate and gives a range instead when irregular', () => {
    const stats = computeCycleStats(REGULAR_PERIODS, { irregular: true });
    const predictions = computePredictions(REGULAR_PERIODS, stats, '2026-03-05');
    expect(predictions.ovulationDateKey).toBeNull();
    expect(predictions.fertileWindow).toBeNull();
    expect(predictions.nextPeriodRange).not.toBeNull();
    expect(predictions.nextPeriodRange.startKey <= predictions.nextPeriodStartKey).toBe(true);
    expect(predictions.nextPeriodRange.endKey >= predictions.nextPeriodStartKey).toBe(true);
  });

  test('flags a late period 3+ days after the predicted start with nothing logged', () => {
    const stats = computeCycleStats(REGULAR_PERIODS, {});
    const onTime = computePredictions(REGULAR_PERIODS, stats, '2026-03-28'); // 2 days late
    expect(onTime.latePeriodPrompt).toBe(false);
    const late = computePredictions(REGULAR_PERIODS, stats, '2026-03-29'); // 3 days late
    expect(late.latePeriodPrompt).toBe(true);
  });

  test('does not flag late when the current period is already logged as ongoing', () => {
    const periods = [...REGULAR_PERIODS, { startDate: '2026-03-30', endDate: null }];
    const stats = computeCycleStats(periods, {});
    const predictions = computePredictions(periods, stats, '2026-04-05');
    expect(predictions.latePeriodPrompt).toBe(false);
    expect(predictions.currentPeriod).not.toBeNull();
  });

  test('prompts to confirm the period ended after 10 days with no end logged', () => {
    const periods = [...REGULAR_PERIODS.slice(0, 2), { startDate: '2026-02-26', endDate: null }];
    const stats = computeCycleStats(periods, {});
    const day9 = computePredictions(periods, stats, '2026-03-06');
    expect(day9.periodEndPrompt).toBe(false);
    const day10 = computePredictions(periods, stats, '2026-03-07');
    expect(day10.periodEndPrompt).toBe(true);
  });

  test('returns null with no logged periods', () => {
    const stats = computeCycleStats([], {});
    expect(computePredictions([], stats, '2026-01-01')).toBeNull();
  });
});

describe('computeCycleState', () => {
  test('reports hasData: false with no periods logged yet', () => {
    expect(computeCycleState([], {}, '2026-01-01').hasData).toBe(false);
  });

  test('bundles today + predictions once periods exist', () => {
    const state = computeCycleState(REGULAR_PERIODS, {}, '2026-03-05');
    expect(state.hasData).toBe(true);
    expect(state.today.phase).toBe('follicular'); // cycle day 8 of ~28, since Feb 26 period
    expect(state.predictions.nextPeriodStartKey).toBe('2026-03-26');
  });
});

describe('formatRelativeDays', () => {
  test.each([
    ['2026-01-05', '2026-01-05', 'today'],
    ['2026-01-06', '2026-01-05', 'tomorrow'],
    ['2026-01-04', '2026-01-05', 'yesterday'],
    ['2026-01-10', '2026-01-05', 'in 5 days'],
    ['2026-01-01', '2026-01-05', '4 days ago'],
  ])('%s relative to %s -> %s', (dateKey, todayKey, expected) => {
    expect(formatRelativeDays(dateKey, todayKey)).toBe(expected);
  });
});

describe('getPhaseSpans', () => {
  test('matches getCycleDayAndPhase day-by-day for a 28-day cycle, 5-day period', () => {
    expect(getPhaseSpans(28, 5)).toEqual([
      { phase: 'menstrual', startDay: 1, endDay: 5 },
      { phase: 'follicular', startDay: 6, endDay: 12 },
      { phase: 'ovulatory', startDay: 13, endDay: 15 },
      { phase: 'luteal', startDay: 16, endDay: 28 },
    ]);
  });

  test('never produces an inverted span for a short cycle', () => {
    const spans = getPhaseSpans(21, 5);
    spans.forEach((s) => expect(s.startDay).toBeLessThanOrEqual(s.endDay));
  });
});

describe('addDays', () => {
  test('handles month and year rollover', () => {
    expect(addDays('2026-01-30', 5)).toBe('2026-02-04');
    expect(addDays('2026-12-30', 5)).toBe('2027-01-04');
    expect(addDays('2026-03-05', -10)).toBe('2026-02-23');
  });
});
