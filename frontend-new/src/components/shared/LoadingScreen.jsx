const LoadingScreen = () => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-emote-canvas font-sans text-emote-body text-emote-ink">
    <div className="emote-mesh" aria-hidden />
    <div className="relative z-10 flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-emote-gold/40 to-emote-accent/40 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emote-border bg-emote-surface shadow-emote">
          <svg
            className="h-8 w-8 animate-spin text-emote-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
      <div className="text-center">
        <p className="emote-title-gradient text-emote-card-title font-semibold">Emote</p>
        <p className="mt-1 text-emote-muted text-emote-ink-faint">Preparing your space…</p>
      </div>
    </div>
  </div>
);

export default LoadingScreen;
