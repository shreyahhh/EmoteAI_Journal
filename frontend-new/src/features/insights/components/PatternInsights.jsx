import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { detectPatterns } from '../../../lib/patternAnalysis';
import { fetchPatternFeedback, submitPatternFeedback, retractPatternFeedback } from '../../../lib/patternFeedback';
import { cn } from '../../../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import EmptyState from '../../../components/shared/EmptyState';

const SEVERITY_STYLES = {
  notice: { icon: TrendingDown, badge: 'bg-[#C2665A]/10 text-[#C2665A] ring-[#C2665A]/30' },
  positive: { icon: TrendingUp, badge: 'bg-emote-accent/10 text-emote-accent ring-emote-accent/30' },
  info: { icon: Sparkles, badge: 'bg-emote-accent/10 text-emote-accent-2 ring-emote-accent/30' },
};

// patternAnalysis.js hands back a bare `type` per pattern (trend/weekday/
// streak/theme/activity), but the card text alone doesn't say which kind of
// tag a correlation is about — "Work Stress" (a theme) and "Social" (an
// activity) read identically. Labeling the category makes that distinction
// visible instead of leaving all tag-correlation patterns looking the same.
const TYPE_LABELS = {
  trend: 'Trend',
  weekday: 'Day of week',
  streak: 'Streak',
  theme: 'Theme',
  activity: 'Activity',
};

const VOTE_BUTTON =
  'rounded-full border px-3 py-1 text-emote-caption font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

/**
 * Uses the full history (not the range picker) — trend detection needs
 * entries outside the selected window to compare against.
 *
 * The thumbs up/down here is the honest way to eventually measure whether
 * these patterns are useful: there's no ground truth to score detector
 * "accuracy" against (see conversation), so this collects real per-user
 * signal on whether each *kind* of insight is worth surfacing, going
 * forward. One standing vote per pattern id — voting again updates it,
 * clicking the same choice twice retracts it.
 */
const PatternInsights = ({ entries, user }) => {
  const patterns = useMemo(() => detectPatterns(entries), [entries]);
  const [feedback, setFeedback] = useState({});
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setFeedback({});
      return undefined;
    }
    fetchPatternFeedback(user.id).then((byPatternId) => {
      if (!cancelled) setFeedback(byPatternId);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleVote = async (pattern, verdict) => {
    if (!user?.id || pendingId) return;
    setPendingId(pattern.id);
    const current = feedback[pattern.id]?.verdict;
    if (current === verdict) {
      setFeedback((prev) => {
        const next = { ...prev };
        delete next[pattern.id];
        return next;
      });
      await retractPatternFeedback(user.id, pattern.id);
    } else {
      setFeedback((prev) => ({ ...prev, [pattern.id]: { patternId: pattern.id, verdict } }));
      await submitPatternFeedback(user.id, pattern, verdict);
    }
    setPendingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patterns worth a look</CardTitle>
        <CardDescription>
          Statistical patterns from your own entries over time — trend, recurring themes, and timing. Each one only
          shows once there's enough data behind it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {patterns.length === 0 ? (
          <EmptyState
            title="Not enough history yet"
            description="Keep journaling — trend and recurring-theme patterns need a handful of entries spread over time before they're reliable."
          />
        ) : (
          <ul className="space-y-3">
            {patterns.map((pattern) => {
              const style = SEVERITY_STYLES[pattern.severity] || SEVERITY_STYLES.info;
              const Icon = style.icon;
              const verdict = feedback[pattern.id]?.verdict;
              return (
                <li key={pattern.id} className="flex items-start gap-3 rounded-xl border border-border bg-emote-surface-alt/40 p-3.5">
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset', style.badge)}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emote-ink-faint">
                      {TYPE_LABELS[pattern.type] || pattern.type}
                    </p>
                    <p className="mt-0.5 font-semibold text-foreground">{pattern.title}</p>
                    <p className="mt-0.5 text-emote-muted leading-relaxed text-muted-foreground">{pattern.description}</p>
                  </div>
                  {user?.id ? (
                    <div className="flex shrink-0 flex-col items-end gap-1.5" role="group" aria-label="Was this pattern useful?">
                      <span className="text-emote-caption text-emote-ink-faint">Useful?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={pendingId === pattern.id}
                          onClick={() => handleVote(pattern, 'up')}
                          aria-pressed={verdict === 'up'}
                          className={cn(
                            VOTE_BUTTON,
                            verdict === 'up'
                              ? 'border-emote-accent bg-emote-accent-2 text-primary-foreground'
                              : 'border-border text-emote-ink-soft hover:border-emote-border-strong',
                          )}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          disabled={pendingId === pattern.id}
                          onClick={() => handleVote(pattern, 'down')}
                          aria-pressed={verdict === 'down'}
                          className={cn(
                            VOTE_BUTTON,
                            verdict === 'down'
                              ? 'border-emote-border-strong bg-emote-surface-alt text-emote-ink'
                              : 'border-border text-emote-ink-soft hover:border-emote-border-strong',
                          )}
                        >
                          Not really
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default PatternInsights;
