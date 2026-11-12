import { SECTION_DIMS, dimAt, heroPresence, skyTravel } from './landingConfig';

describe('Emote background', () => {
  it('dims 0.05 at the hero, 0.4 at planets and Orra, 0.2 everywhere else including the final CTA', () => {
    expect(SECTION_DIMS).toEqual([0.05, 0.2, 0.2, 0.4, 0.2, 0.2, 0.4, 0.2, 0.2, 0.2]);
  });

  it('eases the dim between sections with no visible steps', () => {
    const anchors = SECTION_DIMS.map((_, i) => i * 1000);
    expect(dimAt(0, anchors)).toBe(0.05);
    expect(dimAt(3000, anchors)).toBe(0.4);
    expect(dimAt(2500, anchors)).toBeCloseTo(0.3, 5);
    expect(dimAt(99999, anchors)).toBe(0.2);
    let maxJump = 0;
    let prev = dimAt(0, anchors);
    for (let s = 10; s <= 9000; s += 10) {
      const v = dimAt(s, anchors);
      maxJump = Math.max(maxJump, Math.abs(v - prev));
      prev = v;
    }
    expect(maxJump).toBeLessThan(0.005);
  });

  it('shows the hero shimmer fully at the top and not at all past the hero', () => {
    expect(heroPresence(0, 900)).toBe(1);
    expect(heroPresence(900, 900)).toBe(0);
  });

  it('moves the sky so its bottom meets the screen bottom at page end', () => {
    expect(skyTravel(2800, 800, 20)).toBe(1960);
    expect(skyTravel(500, 800, 20)).toBe(0);
  });
});
