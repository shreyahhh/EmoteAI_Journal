import venus from '../../../assets/landing/planets/emote-venus.webp';
import earth from '../../../assets/landing/planets/emote-earth.webp';
import mercury from '../../../assets/landing/planets/emote-mercury.webp';
import saturn from '../../../assets/landing/planets/emote-saturn.webp';
import jupiter from '../../../assets/landing/planets/emote-jupiter.webp';
import mars from '../../../assets/landing/planets/emote-mars.webp';
import neptune from '../../../assets/landing/planets/emote-neptune.webp';
import uranus from '../../../assets/landing/planets/emote-uranus.webp';

/**
 * Static metadata for the 8 planets (Stars and Planets PRD section 12).
 * baseRadius/baseSize are the same relative proportions used by the
 * landing page's decorative orbit (features/landing/components/LandingPlanetOrbit.jsx),
 * reused here so the two screens read as the same solar system.
 */
export const PLANETS = [
  {
    id: 'venus',
    label: 'Venus',
    quality: 'Love and connection',
    traits: ['Affection', 'Romance', 'Closeness', 'Care'],
    notification: "Today's entry joined Venus. Love left a mark today.",
    firstAppearance: 'Venus has appeared in your galaxy.',
    image: venus,
    baseRadius: 23,
    baseSize: 14,
  },
  {
    id: 'earth',
    label: 'Earth',
    quality: 'Family and home',
    traits: ['Belonging', 'Roots', 'Safety'],
    notification: "Today's entry joined Earth. A moment with the people who are home.",
    firstAppearance: 'Earth has appeared in your galaxy.',
    image: earth,
    baseRadius: 30,
    baseSize: 15,
  },
  {
    id: 'mercury',
    label: 'Mercury',
    quality: 'Learning and communication',
    traits: ['Curiosity', 'Thinking', 'Speaking'],
    notification: "Today's entry joined Mercury. You learned or said something that mattered.",
    firstAppearance: 'Mercury has appeared in your galaxy.',
    image: mercury,
    baseRadius: 16,
    baseSize: 10,
  },
  {
    id: 'saturn',
    label: 'Saturn',
    quality: 'Work and responsibility',
    traits: ['Discipline', 'Duty', 'Structure', 'Pressure'],
    notification: "Today's entry joined Saturn. Another ring of effort.",
    firstAppearance: 'Saturn has appeared in your galaxy.',
    image: saturn,
    baseRadius: 54,
    baseSize: 23,
  },
  {
    id: 'jupiter',
    label: 'Jupiter',
    quality: 'Growth, success and money',
    traits: ['Opportunity', 'Abundance', 'Big wins'],
    notification: "Today's entry joined Jupiter. Something big is growing.",
    firstAppearance: 'Jupiter has appeared in your galaxy.',
    image: jupiter,
    baseRadius: 45,
    baseSize: 26,
  },
  {
    id: 'mars',
    label: 'Mars',
    quality: 'Energy, body and drive',
    traits: ['Strength', 'Ambition', 'Courage', 'Anger'],
    notification: "Today's entry joined Mars. Your fire showed up today.",
    firstAppearance: 'Mars has appeared in your galaxy.',
    image: mars,
    baseRadius: 37,
    baseSize: 12,
  },
  {
    id: 'neptune',
    label: 'Neptune',
    quality: 'Dreams and creativity',
    traits: ['Imagination', 'Intuition', 'Wonder'],
    notification: "Today's entry joined Neptune. A little magic made it in.",
    firstAppearance: 'Neptune has appeared in your galaxy.',
    image: neptune,
    baseRadius: 70,
    baseSize: 17,
  },
  {
    id: 'uranus',
    label: 'Uranus',
    quality: 'Change and new beginnings',
    traits: ['Surprise', 'Freedom', 'Breaking routine'],
    notification: "Today's entry joined Uranus. Something is changing.",
    firstAppearance: 'Uranus has appeared in your galaxy.',
    image: uranus,
    baseRadius: 62,
    baseSize: 18,
  },
];

export const PLANETS_BY_ID = Object.fromEntries(PLANETS.map((p) => [p.id, p]));
