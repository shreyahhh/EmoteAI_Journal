/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
      },
      fontFamily: {
        sans: ['Lora', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
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
        'emote-glow': '0 12px 40px -12px rgba(184, 114, 46, 0.3), 0 8px 24px -8px rgba(201, 151, 31, 0.18)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        shimmer: 'shimmer 8s linear infinite',
      },
      backgroundImage: {
        'gradient-emote':
          'linear-gradient(135deg, rgba(201, 151, 31, 0.1) 0%, transparent 45%, rgba(184, 114, 46, 0.08) 100%)',
      },
    },
  },
  plugins: [],
};
