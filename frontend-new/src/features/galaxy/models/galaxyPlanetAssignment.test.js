import { pickPlanetAssignments, entryIntensity } from './galaxyPlanetAssignment';

describe('entryIntensity', () => {
  test('maps the -10..10 sentiment scale to a 0..1 intensity', () => {
    expect(entryIntensity(0)).toBe(0);
    expect(entryIntensity(5)).toBe(0.5);
    expect(entryIntensity(-10)).toBe(1);
    expect(entryIntensity(undefined)).toBe(0);
  });
});

describe('pickPlanetAssignments', () => {
  test('no scores (scoring failed) means star only', () => {
    expect(pickPlanetAssignments(null, { sentimentScore: 8 })).toEqual({
      primary: null,
      secondary: null,
      needsRecencyTiebreak: [],
    });
  });

  // PRD section 14 worked examples
  test('"Got the job offer, and my partner surprised me with dinner": Jupiter primary, Venus secondary', () => {
    const scores = { jupiter: 0.92, venus: 0.81, saturn: 0.1, mars: 0, mercury: 0, earth: 0, neptune: 0, uranus: 0 };
    expect(pickPlanetAssignments(scores, { sentimentScore: 9 })).toMatchObject({ primary: 'jupiter', secondary: 'venus' });
  });

  test('"Normal day at the office" (Saturn 0.55, below threshold): star only', () => {
    const scores = { saturn: 0.55 };
    expect(pickPlanetAssignments(scores, { sentimentScore: 1 })).toMatchObject({ primary: null, secondary: null });
  });

  test('"Huge fight with my brother about money" (Earth 0.85, Jupiter 0.62): Earth only', () => {
    const scores = { earth: 0.85, jupiter: 0.62 };
    expect(pickPlanetAssignments(scores, { sentimentScore: -8 })).toMatchObject({ primary: 'earth', secondary: null });
  });

  test('"Ran my first 10k today!" (Mars 0.90): Mars only', () => {
    const scores = { mars: 0.9 };
    expect(pickPlanetAssignments(scores, { sentimentScore: 8 })).toMatchObject({ primary: 'mars', secondary: null });
  });

  test('"Booked tickets to move to Bangalore" (Uranus 0.88, Saturn 0.40): Uranus only', () => {
    const scores = { uranus: 0.88, saturn: 0.4 };
    expect(pickPlanetAssignments(scores, { sentimentScore: 7 })).toMatchObject({ primary: 'uranus', secondary: null });
  });

  test('"Feeling a bit low, nothing happened" (all below 0.5): star only', () => {
    const scores = { venus: 0.3, earth: 0.2, mercury: 0.1, saturn: 0.1, jupiter: 0, mars: 0, neptune: 0.4, uranus: 0 };
    expect(pickPlanetAssignments(scores, { sentimentScore: -2 })).toMatchObject({ primary: null, secondary: null });
  });

  test('a high score with low intensity on an ordinary day stays star-only unless it reads as a clear event', () => {
    const scores = { saturn: 0.75 }; // clears the 0.7 threshold but isn't a clear event (< 0.85) and sentiment is mild
    expect(pickPlanetAssignments(scores, { sentimentScore: 1 })).toMatchObject({ primary: null, secondary: null });
  });

  test('a very high score (clear event) joins a planet even with flat sentiment ("Got the job!")', () => {
    const scores = { jupiter: 0.9 };
    expect(pickPlanetAssignments(scores, { sentimentScore: 0.5 })).toMatchObject({ primary: 'jupiter', secondary: null });
  });

  test('three or more matches: keeps only the top two', () => {
    const scores = { jupiter: 0.95, venus: 0.88, saturn: 0.8, mars: 0.75 };
    const out = pickPlanetAssignments(scores, { sentimentScore: 9 });
    expect(out.primary).toBe('jupiter');
    expect(out.secondary).toBe('venus');
  });

  test('two planets tied for the top score flag a recency tie-break instead of guessing', () => {
    const scores = { earth: 0.8, venus: 0.8 };
    const out = pickPlanetAssignments(scores, { sentimentScore: 7 });
    expect(out.needsRecencyTiebreak.sort()).toEqual(['earth', 'venus']);
    expect(['earth', 'venus']).toContain(out.primary);
  });

  test('a manually added entry below threshold is not this function\'s concern (caller allows it separately)', () => {
    // pickPlanetAssignments only models the AI path; a user adding an entry to a
    // planet manually (PRD section 17) bypasses this function entirely.
    const scores = { saturn: 0.2 };
    expect(pickPlanetAssignments(scores, { sentimentScore: 5 })).toMatchObject({ primary: null });
  });
});
