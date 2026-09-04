import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Feather,
  KeyRound,
  Menu,
  MessageCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import Logo from '../../../components/shared/Logo';
import { Button } from '../../../components/ui/button';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'A place to write freely',
    copy: 'The page stays quiet. No forms to complete, no mood to pick. Just a calm place for what is on your mind.',
  },
  {
    icon: Brain,
    title: 'Patterns, gently noticed',
    copy: 'Each saved entry becomes part of a longer view: your mood, emotional tone, and the themes that keep returning.',
  },
  {
    icon: MessageCircle,
    title: 'A chat grounded in you',
    copy: 'Ask about your own journal and Emote looks only to your recent words. Not a vast, generic internet.',
  },
  {
    icon: CalendarDays,
    title: 'A life you can look back on',
    copy: 'Follow a month by month timeline, search old entries, and notice what your better days have in common.',
  },
];

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Your words stay yours',
    copy: 'Export your journal to JSON, TXT, or CSV whenever you like.',
  },
  {
    icon: KeyRound,
    title: 'Private by design',
    copy: 'Your entries are not a public feed, and your personal patterns are never turned into a score.',
  },
  {
    icon: CircleUserRound,
    title: 'Only your recent writing',
    copy: 'Journal chat is grounded in roughly the last 30 days of your own entries.',
  },
];

const STEPS = [
  {
    label: 'Step 01',
    title: 'Write',
    copy: 'Open the page and write freely. Nothing to fill in but the words.',
  },
  {
    label: 'Step 02',
    title: 'Save',
    copy: 'Emote quietly reads for mood, emotions, and themes as your entry is saved.',
  },
  {
    label: 'Step 03',
    title: 'Look back',
    copy: 'See the view across your days, then ask your own journal what it remembers.',
  },
];

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#features', label: "What's inside" },
];

/** Public marketing landing page shown before sign-in — same design tokens and
 * components as the logged-in app, so the two don't feel like separate products. */
export default function LandingPage({ navigateTo }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-emote-canvas font-sans text-emote-ink" style={{ zoom: 16 / 15 }}>
      <header className="sticky top-0 z-30 border-b border-border bg-emote-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-10">
          <button
            type="button"
            className="flex items-center gap-2.5"
            aria-label="Emote home"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Logo size={30} />
            <span className="emote-title-gradient text-emote-page">Emote</span>
          </button>
          <nav className="hidden items-center gap-7 text-emote-muted md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-emote-ink-soft hover:text-emote-ink">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigateTo('login')}
              className="hidden sm:inline-flex"
            >
              Log in
            </Button>
            <Button
              type="button"
              variant="gradient"
              size="sm"
              onClick={() => navigateTo('signup')}
              className="hidden sm:inline-flex"
            >
              Sign up <ArrowRight size={15} />
            </Button>
            <Button
              type="button"
              variant="icon"
              className="md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>
        {menuOpen ? (
          <div className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-emote-ink-soft hover:bg-accent hover:text-emote-ink"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="rounded-xl px-3 py-2.5 text-left text-emote-ink-soft hover:bg-accent hover:text-emote-ink"
            >
              Log in
            </button>
            <Button type="button" variant="gradient" onClick={() => navigateTo('signup')} className="mt-1">
              Sign up <ArrowRight size={15} />
            </Button>
          </div>
        ) : null}
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">
              A private journal, quietly intelligent
            </p>
            <h1 className="mt-3 text-emote-display-lg font-bold leading-tight">
              Journal with <span className="text-emote-accent-2 italic">AI insight.</span>
            </h1>
            <p className="mt-4 max-w-md text-emote-body text-emote-ink-soft">
              Write what is here. Emote notices the patterns in your own words, so you can look back with a little
              more clarity.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Button type="button" variant="gradient" size="lg" onClick={() => navigateTo('signup')}>
                Start journaling <ArrowRight size={17} />
              </Button>
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="inline-flex items-center gap-1 text-emote-body font-semibold text-emote-ink-soft hover:text-emote-ink"
              >
                I already have an account <ChevronRight size={15} />
              </button>
            </div>
            <p className="mt-6 flex items-center gap-1.5 text-emote-caption text-emote-ink-faint">
              <Feather size={13} /> No mood picker. No performance. Just your words.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-emote"
          >
            <p className="text-emote-caption uppercase tracking-wide text-emote-ink-faint">Entry / still becoming</p>
            <div className="mt-5 space-y-3.5">
              <div className="h-2.5 w-11/12 rounded-full bg-emote-surface-alt" />
              <div className="h-2.5 w-4/5 rounded-full bg-emote-surface-alt" />
              <div className="h-2.5 w-full rounded-full bg-emote-surface-alt" />
              <div className="h-2.5 w-3/4 rounded-full bg-emote-surface-alt" />
              <div className="h-2.5 w-5/6 rounded-full bg-emote-surface-alt" />
            </div>
            <p className="mt-6 border-t border-border pt-4 text-emote-caption text-emote-ink-faint">
              Quietly noticing what returns.
            </p>
          </motion.div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10">
          <div className="max-w-xl">
            <p className="text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">
              What's inside
            </p>
            <h2 className="mt-3 text-emote-page font-bold">More than a blank page, a kinder way to notice.</h2>
            <p className="mt-3 text-emote-body text-emote-ink-soft">
              Emote makes space for the daily writing, then gives you something thoughtful to return to when you
              need a wider view.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-emote">
                <Icon size={22} strokeWidth={1.5} className="text-emote-accent-2" />
                <h3 className="mt-4 text-emote-card-title font-semibold">{title}</h3>
                <p className="mt-2 text-emote-muted text-emote-ink-soft">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="privacy" className="bg-emote-surface-alt/60">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:px-10 lg:py-20">
            <div>
              <p className="text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">
                The trust part matters
              </p>
              <h2 className="mt-3 text-emote-page font-bold">Your journal is not a product demo.</h2>
              <p className="mt-3 text-emote-body text-emote-ink-soft">
                It is a record of your life. Emote treats it with the care that deserves.
              </p>
            </div>
            <div className="divide-y divide-border">
              {TRUST_POINTS.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <Icon size={19} strokeWidth={1.6} className="mt-0.5 shrink-0 text-emote-accent-2" />
                  <div>
                    <h3 className="text-emote-card-title font-semibold">{title}</h3>
                    <p className="mt-1 text-emote-muted text-emote-ink-soft">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="max-w-xl">
            <p className="text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">
              How it works
            </p>
            <h2 className="mt-3 text-emote-page font-bold">Three small steps, a longer understanding.</h2>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ label, title, copy }) => (
              <div key={title}>
                <p className="text-emote-caption font-semibold uppercase tracking-wide text-emote-accent-2">
                  {label}
                </p>
                <h3 className="mt-2 text-emote-card-title font-semibold">{title}</h3>
                <p className="mt-2 text-emote-muted text-emote-ink-soft">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-10 lg:pb-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-emote-accent-2 p-8 text-emote-surface sm:flex-row sm:items-center lg:p-10">
            <div>
              <p className="text-emote-caption font-semibold uppercase tracking-wide text-emote-surface/70">
                Begin anywhere
              </p>
              <h2 className="mt-2 font-display text-emote-section font-bold">
                A little more clarity, kept in your own words.
              </h2>
            </div>
            <Button
              type="button"
              onClick={() => navigateTo('signup')}
              className="shrink-0 bg-emote-surface text-emote-accent-2 hover:brightness-95"
            >
              Sign up free <ArrowRight size={17} />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-emote-muted text-emote-ink-soft sm:flex-row sm:justify-between sm:px-6 lg:px-10">
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Logo size={24} />
            <span className="emote-title-gradient text-emote-body">Emote</span>
          </button>
          <p>&copy; {new Date().getFullYear()} Emote. A quieter place to notice.</p>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => navigateTo('login')} className="hover:text-emote-ink">
              Log in
            </button>
            <button type="button" onClick={() => navigateTo('signup')} className="hover:text-emote-ink">
              Sign up
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
