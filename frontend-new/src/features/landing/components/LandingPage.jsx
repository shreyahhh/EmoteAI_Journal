import { useEffect, useRef } from 'react';

import { initEmoteScene } from '../models/landingScene';
import { Body, GalaxyButton, Headline, Plain, ScrollCue, Section, Small } from './LandingPrimitives';
import { LandingSkyBackdrop } from './LandingSkyBackdrop';
import { LandingPlanetOrbit } from './LandingPlanetOrbit';
import './landing.css';

export default function LandingPage({ navigateTo }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = initEmoteScene(root);
    return destroy;
  }, []);

  const goToSignup = () => navigateTo('signup');
  const goToLogin = () => navigateTo('login');

  return (
    <div ref={rootRef} className="landing-root relative">
      <LandingSkyBackdrop />

      <header
        data-topbar
        className="reveal-init fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-landing-void/70 via-landing-void/25 to-transparent px-6 pb-10 pt-6 md:px-10 md:pt-8"
      >
        <span className="type-wordmark" aria-label="Emote home">
          Emote
        </span>
        <button type="button" onClick={goToLogin} className="link-quiet font-sans text-sm tracking-wide">
          Sign in
        </button>
      </header>

      <main className="relative z-10">
        {/* 1 Hero */}
        <Section index={0} label="Emote" visualId="visual-hero" manual scrim after={<ScrollCue />}>
          <Headline as="h1">Write the day down. Watch yourself come into focus.</Headline>
          <Body className="mt-8">
            Emote is an AI journal that reads between your lines, finds your patterns, and shows you who you are, one
            star at a time.
          </Body>
          <GalaxyButton className="mt-12" onClick={goToSignup}>
            Begin your galaxy
          </GalaxyButton>
        </Section>

        {/* 2 Entry */}
        <Section index={1} label="Your entries" visualId="visual-entry">
          <Plain className="mb-14">Skipped the gym again. Called Maa and laughed till my stomach hurt.</Plain>
          <Headline>You write. Emote listens closely.</Headline>
          <Body className="mt-8">Every entry is read for what you felt, what it was about, and what it meant.</Body>
        </Section>

        {/* 3 Patterns */}
        <Section index={2} label="Patterns" visualId="visual-patterns" slowStagger>
          <Headline>You're not random. You have patterns.</Headline>
          <Body className="mt-8">
            Emote connects the dots across weeks and months so you see what lifts you, what drains you, and what keeps
            coming back.
          </Body>
          <div className="mt-16 flex flex-col items-center gap-6">
            <Plain>You feel calmer on days you walk.</Plain>
            <Plain>Sunday nights run heavy. Mondays turn out lighter than you expect.</Plain>
            <Plain>Your best days usually involve people, not plans.</Plain>
          </div>
        </Section>

        {/* 4 Life in orbit */}
        <Section index={3} label="Life in orbit" visualId="visual-planets" after={<LandingPlanetOrbit />}>
          <Headline>See where your life energy actually goes.</Headline>
        </Section>

        {/* 5 Ask your journal */}
        <Section index={4} label="Ask your journal" visualId="visual-chat" slowStagger>
          <Headline>Ask your past self anything.</Headline>
          <Body className="mt-8">Your journal remembers, so you don't have to.</Body>
          <div className="mt-16 flex flex-col items-center gap-6">
            <Plain>When was I happiest this month?</Plain>
            <Plain>The week of the 12th. You wrote about painting twice and slept earlier.</Plain>
          </div>
        </Section>

        {/* 6 Strengths */}
        <Section index={5} label="Strengths" visualId="visual-strengths">
          <Headline>Your strengths are already in your words.</Headline>
          <Body className="mt-8">
            Discover what lights you up, what you're good at, and where you might go next.
          </Body>
          <div className="mt-16 flex flex-col items-center gap-6">
            <Plain>You come alive when you're making something.</Plain>
            <Plain>You handle hard weeks better than you give yourself credit for.</Plain>
          </div>
        </Section>

        {/* 7 Orra */}
        <Section index={6} label="Orra, Keeper of Months" visualId="visual-orra">
          <Body className="mb-10">At the end of every month, someone reads your sky.</Body>
          <Headline>Orra, Keeper of Months</Headline>
          <Plain className="mt-12">
            You laughed more this month. Work felt lighter after the 12th. And there's something you{' '}
            <span className="text-veiled" aria-hidden="true">
              keep coming back to...
            </span>
          </Plain>
          <Small className="mt-8">The rest is written only for you.</Small>
        </Section>

        {/* 8 Cycle */}
        <Section index={7} label="Cycle" visualId="visual-cycle" slowStagger>
          <Headline>Your cycle has been talking. Emote helps you listen.</Headline>
          <Body className="mt-8">
            See how your cycle shapes your mood, energy and focus, spot what's coming before it arrives, and walk into
            appointments with a clear report.
          </Body>
          <div className="mt-16 flex flex-col items-center gap-6">
            <Plain>Your energy peaks in your follicular phase.</Plain>
            <Plain>Heavier days cluster before your period. It's not just you.</Plain>
            <Plain>Next period expected in about 6 days.</Plain>
          </div>
          <Small className="mt-12">Completely optional. Turn it on only if you want it.</Small>
        </Section>

        {/* 9 Privacy */}
        <Section index={8} label="Privacy" visualId="visual-privacy">
          <Headline>No audience. No likes. Just your sky.</Headline>
          <Body className="mt-8">
            Private by default. Not a diagnosis, just a clearer view of you. Export or delete everything, anytime.
          </Body>
        </Section>

        {/* 10 Final CTA */}
        <Section index={9} label="Begin" visualId="visual-final" scrim keepOnLeave>
          <Headline>Your galaxy is waiting for its first star.</Headline>
          <GalaxyButton className="mt-12" onClick={goToSignup}>
            Light your first star
          </GalaxyButton>
          <Small className="mt-8">Your words leave a trail, and it leads back to you.</Small>
        </Section>
      </main>

      <footer className="relative z-10 bg-gradient-to-b from-transparent to-landing-void px-6 pb-12 pt-24 md:px-10">
        <div className="mx-auto flex max-w-[900px] flex-col items-center gap-10 text-center">
          <p className="font-sans text-base text-landing-body">
            If you're going through something heavy, you don't have to face it alone.{' '}
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noreferrer"
              className="text-landing-starlight underline decoration-landing-faint underline-offset-4 transition-colors hover:decoration-landing-starlight"
            >
              Find support near you
            </a>
          </p>
          <nav aria-label="Footer" className="type-small flex items-center gap-8">
            <button type="button" className="link-quiet text-landing-faint">
              Privacy
            </button>
            <button type="button" className="link-quiet text-landing-faint">
              Terms
            </button>
            <button type="button" className="link-quiet text-landing-faint">
              Contact
            </button>
          </nav>
          <p className="type-small">© Emote</p>
        </div>
      </footer>
    </div>
  );
}
