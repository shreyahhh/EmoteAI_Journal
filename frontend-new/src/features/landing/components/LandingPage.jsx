import React from 'react';
import { Menu, X } from 'lucide-react';
import Logo from '../../../components/shared/Logo';
import Starfield from '../../../components/shared/Starfield';
import { Button } from '../../../components/ui/button';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#privacy', label: 'Privacy' },
];

const serifDisplay = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const journalText = { fontFamily: "'Newsreader', Georgia, serif" };

function EyebrowPill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emote-border bg-emote-surface-alt px-4 py-2 text-[13px] text-emote-ink-soft">
      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-emote-accent" />
      {children}
    </span>
  );
}

function StreakVisual() {
  const points = [8, 14, 11, 18, 15, 22, 17, 24, 20, 27, 23, 26];
  const max = Math.max(...points);
  const coords = points.map((v, i) => ({
    x: 8 + (i / (points.length - 1)) * 84,
    y: 70 - (v / max) * 52,
  }));
  const restIndex = 6;
  const path = coords.map((c) => `${c.x},${c.y}`).join(' ');
  return (
    <div className="flex h-full flex-col justify-between p-8">
      <div>
        <p className="text-[40px] leading-none text-emote-ink" style={serifDisplay}>
          12
        </p>
        <p className="mt-1 text-[15px] text-emote-ink-soft">nights in a row</p>
      </div>
      <svg viewBox="0 0 100 80" className="h-28 w-full overflow-visible" preserveAspectRatio="none">
        <polyline fill="none" stroke="rgb(var(--emote-accent))" strokeWidth="1" points={path} />
        {coords.map((c, i) =>
          i === restIndex ? (
            <circle key={i} cx={c.x} cy={c.y} r="2.6" fill="none" stroke="rgb(var(--emote-cool))" strokeWidth="1.4" />
          ) : (
            <circle key={i} cx={c.x} cy={c.y} r="1.6" fill="rgb(var(--emote-accent))" />
          ),
        )}
      </svg>
      <span className="inline-flex w-fit items-center rounded-full border border-emote-border px-3 py-1 text-[12px] text-emote-ink-soft">
        2 rest nights this month
      </span>
    </div>
  );
}

function SaveRestVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-5 p-8">
      <div>
        <p className="text-[12px] uppercase tracking-[0.1em] text-emote-ink-faint">What Emote noticed</p>
        <p className="mt-2 text-[20px] text-emote-ink" style={serifDisplay}>
          Started heavy, easing toward the end.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-emote-cool px-3 py-1 text-[13px] text-emote-cool">feeling small</span>
        <span className="rounded-full border border-emote-cool px-3 py-1 text-[13px] text-emote-cool">tiredness</span>
        <span className="rounded-full border border-emote-warm px-3 py-1 text-[13px] text-emote-warm">hope</span>
      </div>
      <div className="flex gap-2">
        <span className="rounded-full bg-emote-accent px-4 py-1.5 text-[13px] font-semibold text-emote-accent-ink">
          Sounds right
        </span>
        <span className="rounded-full border border-emote-border px-4 py-1.5 text-[13px] text-emote-ink-soft">Not quite</span>
      </div>
    </div>
  );
}

function SkyVisual() {
  const rand = (seed) => {
    const x = Math.sin(seed * 999) * 10000;
    return x - Math.floor(x);
  };
  const dots = Array.from({ length: 28 }, (_, i) => ({
    x: 6 + rand(i) * 88,
    y: 10 + rand(i + 50) * 60,
    match: i === 3 || i === 9 || i === 14 || i === 19 || i === 24,
  }));
  return (
    <div className="flex h-full flex-col gap-4 p-8">
      <div className="flex items-center justify-between rounded-full border border-emote-border bg-emote-canvas px-4 py-2 text-[13px] text-emote-ink-soft">
        <span>dinner</span>
        <span className="text-emote-ink-faint">5 entries</span>
      </div>
      <svg viewBox="0 0 100 70" className="h-32 w-full flex-1">
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.match ? 2.2 : 1}
            fill={d.match ? 'rgb(var(--emote-accent))' : 'rgb(var(--emote-ink-faint))'}
            opacity={d.match ? 1 : 0.5}
            stroke={d.match ? 'rgb(var(--emote-accent))' : 'none'}
            strokeOpacity={0.3}
            strokeWidth={d.match ? 3 : 0}
          />
        ))}
      </svg>
      <div className="flex justify-between text-[12px] text-emote-ink-faint">
        <span>Jan</span>
        <span>Nov</span>
      </div>
    </div>
  );
}

function AskVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-8">
      <p className="ml-auto w-fit rounded-2xl rounded-br-sm bg-emote-surface px-4 py-2 text-[14px] text-emote-ink">
        When did I feel most like myself this month?
      </p>
      <p className="text-[17px] leading-relaxed text-emote-ink-soft" style={journalText}>
        On slow days with family around. Diwali night was the first time in a while your head felt quiet.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-emote-border px-3 py-1 text-[12px] text-emote-ink-faint">20 Oct · Diwali lights</span>
        <span className="rounded-full border border-emote-border px-3 py-1 text-[12px] text-emote-ink-faint">5 Nov · Slow breakfast</span>
      </div>
    </div>
  );
}

const FEATURES = [
  { index: '01', eyebrow: 'The streak', title: 'Show up nightly. Draw your constellation.', copy: 'Every night you write joins the line. Hit 7, 14 and 30-night milestones, and if life gets in the way, use one of two rest nights each month. Your streak stays safe.', visual: <StreakVisual /> },
  { index: '02', eyebrow: 'Save & rest', title: 'Feelings in words, never a score.', copy: 'When you save, Emote tells you in plain language what it noticed in your writing, and asks if it got it right. Your corrections make it understand you better.', visual: <SaveRestVisual /> },
  { index: '03', eyebrow: 'Your sky', title: 'Your whole year, in one glance.', copy: 'Lighter days sit higher, heavier days lower. Search a half-remembered night by a word, or read all of January in order, like a book.', visual: <SkyVisual /> },
  { index: '04', eyebrow: 'Ask your journal', title: 'Questions answered by your own words.', copy: 'Ask anything about the last 30 days. Every answer shows which entries it came from. Nothing from the internet, nothing invented.', visual: <AskVisual /> },
];

const TRUST_POINTS = [
  { index: '01', title: 'Your words stay yours', copy: 'Export everything as PDF, text, CSV or JSON. Delete your account and every entry goes with it.' },
  { index: '02', title: 'Read only when you save', copy: 'Nothing is analysed while you type. You can switch analysis off completely and keep a plain journal.' },
  { index: '03', title: 'No feed, no audience', copy: "There's no public profile and nothing to share by accident. It's a journal, not a social app." },
];

function PreviewWindow() {
  return (
    <div className="relative mx-auto max-w-[1040px]">
      <div
        className="pointer-events-none absolute inset-x-10 -top-10 h-20"
        style={{ boxShadow: '0 -30px 80px rgba(232,181,122,.06)' }}
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-t-[24px] border border-b-0 border-emote-border" style={{ backgroundColor: '#07070A' }}>
        <div className="flex items-center justify-between border-b border-emote-line-soft px-9 py-5">
          <span className="flex items-center gap-2 text-emote-ink" style={{ ...serifDisplay, fontSize: 20 }}>
            <Menu className="h-4 w-4" /> Emote
          </span>
          <span className="flex items-center gap-2 text-[12px] text-emote-accent">
            <span className="h-2 w-2 rounded-full bg-emote-accent" /> 12-night streak
          </span>
        </div>
        <div className="px-9 py-11 sm:px-[72px] sm:py-11">
          <h3 className="text-emote-ink" style={{ ...serifDisplay, fontSize: 'clamp(28px,4vw,48px)' }}>
            What landed at dinner
          </h3>
          <div className="mt-5 flex gap-8 sm:gap-12">
            <div className="flex shrink-0 flex-col gap-1.5">
              <span className="w-1 rounded-full bg-emote-cool" style={{ height: 60 }} />
              <span className="w-1 rounded-full bg-emote-cool" style={{ height: 90 }} />
              <span className="w-1 rounded-full bg-emote-warm" style={{ height: 70 }} />
            </div>
            <div className="min-w-0 flex-1 space-y-4 text-[19px] leading-[1.8]" style={journalText}>
              <p className="text-emote-ink-soft">
                Couldn&rsquo;t sleep, so I&rsquo;m here. The house is finally quiet and my head isn&rsquo;t. I keep going back
                to what Ma said at dinner&hellip;
              </p>
              <p className="text-emote-ink">
                Maybe what I actually want to tell her is that I&rsquo;m trying
                <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-emote-accent motion-reduce:animate-none" aria-hidden />
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center pb-12">
          <div className="flex items-center gap-4 rounded-full border border-emote-border bg-emote-surface py-2 pl-5 pr-2">
            <span className="text-[12px] text-emote-ink-faint">18 min · 512 words · Sound: Rain · Draw a card</span>
            <span className="rounded-full bg-emote-accent px-5 py-2 text-[13px] font-semibold text-emote-accent-ink">Save &amp; rest</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ navigateTo }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-emote-canvas font-sans text-emote-ink">
      <header className="relative z-20 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <button type="button" className="flex items-center gap-2.5" aria-label="Emote home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size={28} />
            <span style={{ ...serifDisplay, fontSize: 30 }} className="text-emote-ink">
              Emote
            </span>
          </button>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="flex h-11 items-center text-[14px] text-emote-ink-soft hover:text-emote-ink">
                {link.label}
              </a>
            ))}
            <button type="button" onClick={() => navigateTo('login')} className="flex h-11 items-center text-[14px] text-emote-ink-soft hover:text-emote-ink">
              Sign in
            </button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigateTo('signup')}
              className="h-11 border-emote-accent bg-transparent text-emote-accent hover:bg-emote-accent/10"
            >
              Start writing
            </Button>
          </nav>
          <Button type="button" variant="icon" className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
        {menuOpen ? (
          <div className="mx-auto mt-3 flex max-w-[1200px] flex-col gap-1 border-t border-emote-border pt-3 md:hidden">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-emote-ink-soft hover:bg-emote-surface-alt hover:text-emote-ink">
                {link.label}
              </a>
            ))}
            <button type="button" onClick={() => navigateTo('login')} className="rounded-xl px-3 py-2.5 text-left text-emote-ink-soft hover:bg-emote-surface-alt hover:text-emote-ink">
              Sign in
            </button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigateTo('signup')}
              className="mt-1 border-emote-accent bg-transparent text-emote-accent hover:bg-emote-accent/10"
            >
              Start writing
            </Button>
          </div>
        ) : null}
      </header>

      <main className="relative">
        <section className="relative overflow-hidden px-6 pb-16 pt-24 sm:px-10">
          <Starfield count={90} seed={7} className="h-[60%]" />
          <div className="relative mx-auto flex max-w-[1200px] flex-col items-start">
            <EyebrowPill>A private journal for the end of the day</EyebrowPill>
            <h1
              className="mt-7 max-w-[1000px] text-emote-ink"
              style={{ ...serifDisplay, fontSize: 'clamp(2.75rem,9vw,112px)', lineHeight: 0.95, letterSpacing: '-0.01em' }}
            >
              Write the day down.
              <br />
              <span className="italic text-emote-accent">Watch it become a sky.</span>
            </h1>
            <p className="mt-7 max-w-[600px] text-[19px] leading-[1.6] text-emote-ink-soft" style={{ textWrap: 'balance' }}>
              A quiet page for your thoughts. When you save, Emote notices the tone of your words, and every night you
              write becomes a star you can come back to.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Button
                type="button"
                variant="gradient"
                onClick={() => navigateTo('signup')}
                className="h-14 rounded-full px-[30px] text-[16px] font-semibold text-emote-accent-ink"
              >
                Start tonight, it&rsquo;s free
              </Button>
              <a
                href="#features"
                className="flex h-14 items-center rounded-full border border-emote-border px-[30px] text-[16px] font-medium text-emote-ink"
              >
                See how it works
              </a>
            </div>
            <p className="mt-5 text-[13px] text-emote-ink-faint">No mood picker &middot; No ads &middot; Export everything, anytime</p>
          </div>

          <div className="relative mt-24">
            <PreviewWindow />
          </div>
        </section>

        <section id="features" className="relative mx-auto max-w-[1200px] px-6 pt-20 text-center sm:px-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-emote-accent">What happens after you write</p>
          <h2 className="mx-auto mt-4 max-w-[820px] text-emote-ink" style={{ ...serifDisplay, fontSize: 'clamp(2rem,6vw,64px)', lineHeight: 1.1 }}>
            A journal that quietly pays attention, so you can look back with a little more clarity.
          </h2>

          <div className="mt-20 space-y-16 text-left">
            {FEATURES.map((f, i) => (
              <div key={f.index} className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div>
                  <p className="text-emote-accent" style={{ ...serifDisplay, fontSize: 22 }}>
                    {f.index} · {f.eyebrow}
                  </p>
                  <h3 className="mt-3 text-emote-ink" style={{ ...serifDisplay, fontSize: 'clamp(1.75rem,5vw,52px)', lineHeight: 1.1 }}>
                    {f.title}
                  </h3>
                  <p className="mt-4 text-[17px] leading-relaxed text-emote-ink-soft">{f.copy}</p>
                </div>
                <div className="h-[380px] overflow-hidden rounded-[28px] border border-emote-border bg-emote-surface-alt">{f.visual}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="privacy" className="mt-24 bg-emote-band">
          <div className="mx-auto max-w-[1200px] px-6 py-20 sm:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-[620px] text-emote-ink" style={{ ...serifDisplay, fontSize: 'clamp(2rem,6vw,64px)', lineHeight: 1.1 }}>
                Your journal is not a product demo.
              </h2>
              <p className="max-w-xs text-[17px] text-emote-ink-soft">
                It&rsquo;s a record of your life. Emote treats it with that kind of care.
              </p>
            </div>
            <div className="mt-12 grid gap-5 text-left sm:grid-cols-3">
              {TRUST_POINTS.map((t) => (
                <div key={t.index} className="rounded-[22px] border border-emote-border bg-emote-surface p-7">
                  <p className="text-emote-accent" style={{ ...serifDisplay, fontSize: 22 }}>
                    {t.index}
                  </p>
                  <h3 className="mt-2 text-[19px] text-emote-ink" style={serifDisplay}>
                    {t.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-emote-ink-soft">{t.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-28 text-center sm:px-10">
          <Starfield count={50} seed={23} />
          <div className="relative">
            <h2 className="text-emote-ink" style={{ ...serifDisplay, fontSize: 'clamp(2.25rem,8vw,88px)', lineHeight: 1.05 }}>
              Tonight could be
              <br />
              <span className="italic text-emote-accent">your first star.</span>
            </h2>
            <Button
              type="button"
              variant="gradient"
              onClick={() => navigateTo('signup')}
              className="mt-9 h-14 rounded-full px-[30px] text-[16px] font-semibold text-emote-accent-ink"
            >
              Start writing, it&rsquo;s free
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-emote-border px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 text-[13px] text-emote-ink-faintest sm:flex-row sm:justify-between">
          <button type="button" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size={22} />
            <span style={{ ...serifDisplay, fontSize: 18 }} className="text-emote-ink">
              Emote
            </span>
          </button>
          <p>&copy; {new Date().getFullYear()} Emote &middot; Not a substitute for professional care</p>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => navigateTo('login')} className="hover:text-emote-ink-soft">
              Sign in
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
