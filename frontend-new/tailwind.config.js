/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emote: {
          canvas: '#f4f6fb',
          surface: '#ffffff',
          muted: '#f1f5f9',
          line: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
        emote: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.08)',
        'emote-glow': '0 12px 40px -12px rgba(251, 113, 133, 0.25), 0 8px 24px -8px rgba(45, 212, 191, 0.12)',
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
          'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, transparent 45%, rgba(251, 113, 133, 0.06) 100%)',
      },
    },
  },
  plugins: [],
};
