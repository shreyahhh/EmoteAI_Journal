import React from 'react';

// Deterministic pseudo-random so the scatter doesn't reshuffle on every render.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Real star colors by spectral class, weighted the way they actually show up
// in a naked-eye sky: mostly blue-white/white, with gold, orange and red
// giants as rarer accents. Cumulative weights for a single-pass pick.
const STAR_COLOR_STOPS = [
  { color: 'rgb(var(--star-blue))', weight: 0.1 },
  { color: 'rgb(var(--star-blue-white))', weight: 0.22 },
  { color: 'rgb(var(--star-white))', weight: 0.32 },
  { color: 'rgb(var(--star-yellow-white))', weight: 0.2 },
  { color: 'rgb(var(--star-orange))', weight: 0.11 },
  { color: 'rgb(var(--star-red))', weight: 0.05 },
];

function pickStarColor(rand) {
  const r = rand();
  let acc = 0;
  for (const stop of STAR_COLOR_STOPS) {
    acc += stop.weight;
    if (r <= acc) return stop.color;
  }
  return STAR_COLOR_STOPS[STAR_COLOR_STOPS.length - 1].color;
}

/** Scattered, twinkling star dots for hero/footer backdrops. ~90 dots across
 * the top of the hero by default, colored by real stellar spectral class
 * (mostly blue-white/white, rarer gold/orange/red) rather than theme accent
 * tones. Pure CSS opacity animation, randomized duration and delay per dot
 * so they don't pulse in sync; disabled under prefers-reduced-motion. */
export default function Starfield({ count = 90, seed = 1, className = '' }) {
  const dots = React.useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: rand() < 0.2 ? 2.5 : rand() < 0.6 ? 1.75 : 1.2,
      color: pickStarColor(rand),
      baseOpacity: 0.3 + rand() * 0.45,
      duration: 3 + rand() * 5,
      delay: rand() * 6,
    }));
  }, [count, seed]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full motion-safe:animate-twinkle"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            backgroundColor: d.color,
            opacity: d.baseOpacity,
            '--twinkle-base': d.baseOpacity,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
