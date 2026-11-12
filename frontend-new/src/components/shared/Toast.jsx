import React, { useEffect } from 'react';

/**
 * Minimal auto-dismissing in-app banner. No server push infrastructure
 * exists yet (see supabase/migrations README and the Notifications PRD), so
 * "notifications" from this app are in-app-only moments like this one.
 */
export default function Toast({ message, onDismiss, durationMs = 6000 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, durationMs]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[min(90vw,28rem)] items-center gap-3 rounded-none border border-emote-border bg-emote-surface px-5 py-3 text-emote-muted text-emote-ink shadow-emote"
    >
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} className="text-emote-ink-faint transition hover:text-emote-ink" aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
