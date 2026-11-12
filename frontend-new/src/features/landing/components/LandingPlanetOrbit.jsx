import mercury from '../../../assets/landing/planets/emote-mercury.webp';
import venus from '../../../assets/landing/planets/emote-venus.webp';
import earth from '../../../assets/landing/planets/emote-earth.webp';
import mars from '../../../assets/landing/planets/emote-mars.webp';
import jupiter from '../../../assets/landing/planets/emote-jupiter.webp';
import saturn from '../../../assets/landing/planets/emote-saturn.webp';
import uranus from '../../../assets/landing/planets/emote-uranus.webp';
import neptune from '../../../assets/landing/planets/emote-neptune.webp';

// Orbit radius (vmin, from the shared centre) and planet size (px), ordered by
// real distance from the sun. Durations are a decorative gradient, not literal
// Kepler timing: inner orbits sweep faster than outer ones.
const PLANETS = [
  { name: 'Mercury', src: mercury, radius: 16, size: 10, duration: 18 },
  { name: 'Venus', src: venus, radius: 23, size: 14, duration: 26 },
  { name: 'Earth', src: earth, radius: 30, size: 15, duration: 34 },
  { name: 'Mars', src: mars, radius: 37, size: 12, duration: 42 },
  { name: 'Jupiter', src: jupiter, radius: 45, size: 26, duration: 56 },
  { name: 'Saturn', src: saturn, radius: 54, size: 23, duration: 70 },
  { name: 'Uranus', src: uranus, radius: 62, size: 18, duration: 84 },
  { name: 'Neptune', src: neptune, radius: 70, size: 17, duration: 98 },
];

/**
 * Decorative solar system for the "Life in orbit" section: concentric rings
 * that revolve around a shared centre, each at its own speed. The planet
 * image counter-rotates against its ring so it drifts around the centre
 * without visibly spinning in place.
 */
export function LandingPlanetOrbit() {
  return (
    <div aria-hidden="true" className="orbit-field pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {PLANETS.map((p) => (
        <div
          key={p.name}
          className="orbit-ring absolute rounded-full border border-landing-starlight/10"
          style={{
            width: `${p.radius * 2}vmin`,
            height: `${p.radius * 2}vmin`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <div className="orbit-counter absolute left-1/2 top-0" style={{ animationDuration: `${p.duration}s` }}>
            <img
              src={p.src}
              alt=""
              draggable={false}
              className="orbit-planet -translate-x-1/2 -translate-y-1/2"
              style={{ width: p.size, height: p.size }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
