import { fitCycleModel } from './cycleModel';

// Deterministic PRNG so the tests are stable.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rand) => {
  let u = 0; let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const key = (epochDay) => new Date(epochDay * 86400000).toISOString().slice(0, 10);
const START = Math.floor(Date.UTC(2025, 0, 1) / 86400000);

/**
 * Simulates `cycles` cycles of 28 days. `effect(daysToNext, inPeriod)` is added
 * to a baseline of +1; noise is N(0, noiseSd). ~70% of days have an entry.
 */
function simulate({ cycles, effect, noiseSd = 1.2, seed = 1 }) {
  const rand = mulberry32(seed);
  const periods = [];
  const entries = [];
  for (let c = 0; c < cycles; c += 1) {
    const start = START + c * 28;
    periods.push({
      startDate: key(start),
      endDate: key(start + 4),
      symptoms: c % 2 ? ['cramps'] : ['cramps', 'fatigue'],
    });
    for (let d = 0; d < 28; d += 1) {
      if (rand() > 0.7) continue;
      const inPeriod = d <= 4;
      const daysToNext = 28 - d;
      const score = 1 + effect(daysToNext, inPeriod) + gauss(rand) * noiseSd;
      entries.push({ createdAt: `${key(start + d)}T12:00:00`, sentimentScore: Math.max(-10, Math.min(10, score)) });
    }
  }
  const todayKey = key(START + cycles * 28 - 1);
  return { entries, periods, todayKey };
}

describe('fitCycleModel', () => {
  test('no logged periods -> nothing to anchor to', () => {
    const m = fitCycleModel([{ createdAt: '2025-01-05T12:00:00', sentimentScore: 2 }], []);
    expect(m.status).toBe('no-periods');
    expect(m.usable).toBe(false);
  });

  test('too little data is reported, not guessed', () => {
    const { entries, periods, todayKey } = simulate({ cycles: 2, effect: () => 0 });
    const m = fitCycleModel(entries, periods, { todayKey });
    expect(m.status).toBe('not-enough-data');
    expect(m.predict).toBeUndefined();
  });

  test('finds a real pre-menstrual dip and beats the personal average out of sample', () => {
    const { entries, periods, todayKey } = simulate({
      cycles: 8,
      effect: (daysToNext, inPeriod) => (daysToNext <= 5 ? -4 : inPeriod ? -2 : 0),
    });
    const m = fitCycleModel(entries, periods, { todayKey });
    expect(m.status).toBe('ready');
    expect(m.cv.improvementPct).toBeGreaterThan(20);
    expect(m.cv.maeModel).toBeLessThan(m.cv.maeBaseline);

    // Learned the shape: pre-menstrual days predicted well below mid-cycle days.
    const pms = m.curve.filter((c) => c.cycleDay >= 24 && c.cycleDay <= 27).map((c) => c.expected);
    const mid = m.curve.filter((c) => c.cycleDay >= 8 && c.cycleDay <= 14).map((c) => c.expected);
    const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    expect(avg(mid) - avg(pms)).toBeGreaterThan(2);
  });

  test('refuses to invent a pattern in pure noise', () => {
    const { entries, periods, todayKey } = simulate({ cycles: 8, effect: () => 0, noiseSd: 2, seed: 7 });
    const m = fitCycleModel(entries, periods, { todayKey });
    expect(m.usable).toBe(false);
    expect(['no-reliable-pattern', 'not-enough-data']).toContain(m.status);
    expect(m.predict).toBeUndefined();
  });

  test('forecast and assess work once a pattern is found', () => {
    const { entries, periods, todayKey } = simulate({
      cycles: 8,
      effect: (daysToNext) => (daysToNext <= 5 ? -4 : 0),
    });
    const m = fitCycleModel(entries, periods, { todayKey });
    const next = m.forecast(28, key(START + 8 * 28));
    expect(next).toHaveLength(28);
    next.forEach((p) => {
      expect(p.low).toBeLessThanOrEqual(p.expected);
      expect(p.expected).toBeLessThanOrEqual(p.high);
    });
    const dips = next.filter((p) => p.cycleDay >= 25).map((p) => p.expected);
    const mids = next.filter((p) => p.cycleDay >= 8 && p.cycleDay <= 14).map((p) => p.expected);
    expect(Math.min(...dips)).toBeLessThan(Math.min(...mids));

    // An entry far below what's expected for that day is flagged.
    const midDay = key(START + 7 * 28 + 10);
    const low = m.assess({ createdAt: `${midDay}T12:00:00`, sentimentScore: -8 });
    expect(low.verdict).toBe('lower-than-usual');
    const fine = m.assess({ createdAt: `${midDay}T12:00:00`, sentimentScore: 1 });
    expect(fine.verdict).toBe('typical');
  });

  test('entries before the first period or in an overdue stretch are skipped', () => {
    const periods = [{ startDate: '2025-02-01', endDate: '2025-02-05', symptoms: [] }];
    const entries = [
      { createdAt: '2025-01-10T12:00:00', sentimentScore: 3 }, // before any period
      { createdAt: '2025-04-20T12:00:00', sentimentScore: 3 }, // far past the expected next period
    ];
    const m = fitCycleModel(entries, periods, { todayKey: '2025-05-01' });
    expect(m.n).toBe(0);
  });
});
