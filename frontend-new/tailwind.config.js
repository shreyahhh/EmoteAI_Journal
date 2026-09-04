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
          border: 'rgb(var(--emote-border) / <alpha-value>)',
          'border-strong': 'rgb(var(--emote-border-strong) / <alpha-value>)',
          ink: 'rgb(var(--emote-ink) / <alpha-value>)',
          'ink-soft': 'rgb(var(--emote-ink-soft) / <alpha-value>)',
          'ink-faint': 'rgb(var(--emote-ink-faint) / <alpha-value>)',
          accent: 'rgb(var(--emote-accent) / <alpha-value>)',
          'accent-2': 'rgb(var(--emote-accent-2) / <alpha-value>)',
          gold: 'rgb(var(--emote-gold) / <alpha-value>)',
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
        display: ['Inter', 'system-ui', 'sans-serif'],
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
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
