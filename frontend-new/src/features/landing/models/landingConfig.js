/**
 * Background settings for the Emote landing page. Pure data + math so it can be unit
 * tested and shared by the scene loop.
 */

/** Black dim overlay opacity at the centre of each section. Index 0 = Hero, 9 = Final CTA. */
export const SECTION_DIMS = [
  0.05, // 1 Hero
  0.2, // 2 Entry
  0.2, // 3 Patterns
  0.4, // 4 Life in orbit (planets)
  0.2, // 5 Ask your journal
  0.2, // 6 Strengths
  0.4, // 7 Orra
  0.2, // 8 Cycle
  0.2, // 9 Privacy
  0.2, // 10 Final CTA
];

/** Share of twinkling stars that fade out once the visitor is below the hero. */
export const BELOW_HERO_STAR_CUT = 0.4;

/** Extra pixels the sky image extends past every viewport edge, so drift and mouse parallax never reveal an edge. */
export const SKY_BLEED = 20;

export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp01 = (x) => Math.min(1, Math.max(0, x));

export const smoothstep = (e0, e1, x) => {
  if (e1 === e0) return x < e0 ? 0 : 1;
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/**
 * Dim opacity at a scroll position. `anchors[i]` is the scroll position where section i is
 * centred on screen; between anchors the value eases smoothly so there are no visible steps.
 */
export function dimAt(scroll, anchors, dims = SECTION_DIMS) {
  const n = Math.min(anchors.length, dims.length);
  if (n === 0) return dims[0] ?? 0;
  if (scroll <= anchors[0]) return dims[0];
  for (let i = 0; i < n - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (scroll <= b) return lerp(dims[i], dims[i + 1], smoothstep(a, b, scroll));
  }
  return dims[n - 1];
}

/** 1 while the hero fills the screen, easing to 0 as the visitor scrolls past it. */
export const heroPresence = (scroll, heroHeight) =>
  1 - smoothstep(heroHeight * 0.1, heroHeight * 0.95, scroll);

/** How far the sky image must travel up so its bottom edge meets the bottom of the screen at page end. */
export const skyTravel = (wrapperHeight, viewportHeight, bleed = SKY_BLEED) =>
  Math.max(0, wrapperHeight - bleed * 2 - viewportHeight);

/** Positive modulo, for wrapping parallax layers. */
export const wrap = (value, span) => ((value % span) + span) % span;
