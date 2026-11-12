/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emote: {
          canvas: 'rgb(var(--emote-canvas) / <alpha-value>)',
          surface: 'rgb(var(--emote-surface) / <alpha-value>)',
          'surface-alt': 'rgb(var(--emote-surface-alt) / <alpha-value>)',
          band: 'rgb(var(--emote-band) / <alpha-value>)',
          border: 'rgb(var(--emote-border) / <alpha-value>)',
          'border-strong': 'rgb(var(--emote-border-strong) / <alpha-value>)',
          'line-soft': 'rgb(var(--emote-line-soft) / <alpha-value>)',
          ink: 'rgb(var(--emote-ink) / <alpha-value>)',
          'ink-soft': 'rgb(var(--emote-ink-soft) / <alpha-value>)',
          'ink-faint': 'rgb(var(--emote-ink-faint) / <alpha-value>)',
          'ink-faintest': 'rgb(var(--emote-ink-faintest) / <alpha-value>)',
          accent: 'rgb(var(--emote-accent) / <alpha-value>)',
          'accent-2': 'rgb(var(--emote-accent-2) / <alpha-value>)',
          'accent-ink': 'rgb(var(--emote-accent-ink) / <alpha-value>)',
          gold: 'rgb(var(--emote-gold) / <alpha-value>)',
          warm: 'rgb(var(--emote-warm) / <alpha-value>)',
          cool: 'rgb(var(--emote-cool) / <alpha-value>)',
          rose: 'rgb(var(--emote-rose) / <alpha-value>)',
        },
        // Cycle v2 mini-app's own fixed palette (see .cycle-root in index.css)
        // — kept out of the emote.* namespace since it never re-themes with
        // the user's chosen Emote palette.
        cycle: {
          bg: 'rgb(var(--cycle-bg) / <alpha-value>)',
          surface: 'rgb(var(--cycle-surface) / <alpha-value>)',
          'surface-2': 'rgb(var(--cycle-surface-2) / <alpha-value>)',
          tabbar: 'rgb(var(--cycle-tabbar) / <alpha-value>)',
          line: 'rgb(var(--cycle-line) / <alpha-value>)',
          'line-soft': 'rgb(var(--cycle-line-soft) / <alpha-value>)',
          text: 'rgb(var(--cycle-text) / <alpha-value>)',
          'text-2': 'rgb(var(--cycle-text-2) / <alpha-value>)',
          muted: 'rgb(var(--cycle-muted) / <alpha-value>)',
          faint: 'rgb(var(--cycle-faint) / <alpha-value>)',
          accent: 'rgb(var(--cycle-accent) / <alpha-value>)',
          'accent-ink': 'rgb(var(--cycle-accent-ink) / <alpha-value>)',
          menstrual: 'rgb(var(--cycle-menstrual) / <alpha-value>)',
          'menstrual-ink': 'rgb(var(--cycle-menstrual-ink) / <alpha-value>)',
          follicular: 'rgb(var(--cycle-follicular) / <alpha-value>)',
          ovulatory: 'rgb(var(--cycle-ovulatory) / <alpha-value>)',
          luteal: 'rgb(var(--cycle-luteal) / <alpha-value>)',
          'tone-lighter': 'rgb(var(--cycle-tone-lighter) / <alpha-value>)',
          'tone-heavier': 'rgb(var(--cycle-tone-heavier) / <alpha-value>)',
          'tone-neutral': 'rgb(var(--cycle-tone-neutral) / <alpha-value>)',
        },
        // Landing page's own fixed night-sky palette (see .landing-root in
        // landing.css) — a marketing-page-only design, kept out of the
        // emote.* namespace since it never re-themes with the in-app palette.
        landing: {
          void: 'rgb(var(--landing-void) / <alpha-value>)',
          starlight: 'rgb(var(--landing-starlight) / <alpha-value>)',
          body: 'rgb(var(--landing-body) / <alpha-value>)',
          faint: 'rgb(var(--landing-faint) / <alpha-value>)',
          violet: 'rgb(var(--landing-violet) / <alpha-value>)',
          rose: 'rgb(var(--landing-rose) / <alpha-value>)',
          'deep-blue': 'rgb(var(--landing-deep-blue) / <alpha-value>)',
          gold: 'rgb(var(--landing-gold) / <alpha-value>)',
          teal: 'rgb(var(--landing-teal) / <alpha-value>)',
        },
        // shadcn/ui's standard token names — bridged onto the same emote-* RGB values
        // in index.css so ported shadcn component source works unmodified.
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        // Journal text only (entry titles/body in previews, composer, reflections).
        serif: ['"Newsreader"', 'Georgia', 'serif'],
        // Matches the shadcn base-sera preset's font-mono (Geist Mono).
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'emote-display': [
          'var(--emote-fs-display)',
          {
            lineHeight: 'var(--emote-lh-display)',
            letterSpacing: 'var(--emote-ls-display)',
          },
        ],
        'emote-display-lg': [
          'var(--emote-fs-display-lg)',
          {
            lineHeight: 'var(--emote-lh-display-lg)',
            letterSpacing: 'var(--emote-ls-display)',
          },
        ],
        'emote-page': [
          'var(--emote-fs-page)',
          {
            lineHeight: 'var(--emote-lh-page)',
            letterSpacing: 'var(--emote-ls-page)',
          },
        ],
        'emote-section': [
          'var(--emote-fs-section)',
          {
            lineHeight: 'var(--emote-lh-section)',
            letterSpacing: 'var(--emote-ls-section)',
          },
        ],
        'emote-card-title': [
          'var(--emote-fs-card-title)',
          {
            lineHeight: 'var(--emote-lh-card-title)',
            letterSpacing: 'var(--emote-ls-card-title)',
          },
        ],
        'emote-body': ['var(--emote-fs-body)', { lineHeight: 'var(--emote-lh-body)' }],
        'emote-muted': ['var(--emote-fs-muted)', { lineHeight: 'var(--emote-lh-muted)' }],
        'emote-caption': ['var(--emote-fs-caption)', { lineHeight: 'var(--emote-lh-caption)' }],
        'emote-nav': ['var(--emote-fs-nav)', { lineHeight: 'var(--emote-lh-nav)' }],
      },
      boxShadow: {
        emote: '0 1px 2px rgba(74, 50, 32, 0.06), 0 8px 24px -4px rgba(74, 50, 32, 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        twinkle: {
          '0%, 100%': { opacity: 'var(--twinkle-base, 0.4)' },
          '50%': { opacity: 'calc(var(--twinkle-base, 0.4) * 0.25)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        twinkle: 'twinkle 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
