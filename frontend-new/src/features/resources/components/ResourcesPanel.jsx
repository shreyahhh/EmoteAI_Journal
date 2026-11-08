import React, { useMemo, useState } from 'react';
import { Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { RESOURCES, RESOURCE_TYPES, getResourceById } from '../../../lib/resourceLibrary';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

const FILTERS = ['All', ...RESOURCE_TYPES];

function pickForThisWeek(entries) {
  const recentThemes = new Set(
    entries.slice(0, 10).flatMap((e) => [...(e.themes || []), ...(e.activities || [])].map((t) => t.toLowerCase())),
  );
  const scored = RESOURCES.map((r) => ({
    resource: r,
    matches: r.tags.filter((t) => recentThemes.has(t.toLowerCase())),
  })).filter((s) => s.matches.length > 0);
  scored.sort((a, b) => b.matches.length - a.matches.length);
  return scored.slice(0, 2);
}

const ResourceDetail = ({ resource, onBack, onWriteEntry, reason }) => {
  const [vote, setVote] = useState(null);
  return (
    <div className="mx-auto max-w-2xl">
      <button type="button" onClick={onBack} className="mb-6 flex items-center gap-1.5 text-emote-muted font-semibold text-emote-accent">
        <ArrowLeft className="h-4 w-4" /> All resources
      </button>
      <p className="text-emote-muted text-emote-ink-faint">
        {resource.type} &middot; {resource.minutes} min{reason ? ` · ${reason}` : ''}
      </p>
      <h1 className="mt-2 text-emote-display font-semibold text-emote-ink">{resource.title}</h1>
      <div className="mt-6 space-y-4 text-emote-body leading-relaxed text-emote-ink-soft">
        {resource.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {resource.exercise ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">
            Try it tonight &middot; {resource.exercise.minutes} minutes
          </p>
          <ol className="mt-4 space-y-3">
            {resource.exercise.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-display text-emote-section text-emote-accent">
                  {i + 1}
                </span>
                <span className="mt-1 text-emote-body text-emote-ink">{step}</span>
              </li>
            ))}
          </ol>
          {onWriteEntry ? (
            <Button type="button" variant="gradient" onClick={onWriteEntry} className="mt-5">
              Write it as tonight&rsquo;s entry
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
        <p className="text-emote-muted text-emote-ink-faint">Was this helpful?</p>
        <button
          type="button"
          onClick={() => setVote('yes')}
          className={cn(
            'rounded-full border px-4 py-1.5 text-emote-caption font-semibold transition',
            vote === 'yes' ? 'border-emote-accent bg-emote-accent-2 text-primary-foreground' : 'border-border text-emote-ink-soft',
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setVote('no')}
          className={cn(
            'rounded-full border px-4 py-1.5 text-emote-caption font-semibold transition',
            vote === 'no' ? 'border-emote-border-strong bg-emote-surface-alt text-emote-ink' : 'border-border text-emote-ink-soft',
          )}
        >
          Not really
        </button>
      </div>
      <p className="mt-6 text-emote-caption text-emote-ink-faint">Self-guided reading, not a substitute for professional care.</p>
    </div>
  );
};

const ResourcesPanel = ({ entries, onWriteEntry }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('All');

  const forThisWeek = useMemo(() => pickForThisWeek(entries), [entries]);

  const filtered = useMemo(
    () => (filter === 'All' ? RESOURCES : RESOURCES.filter((r) => r.type === filter)),
    [filter],
  );

  if (selectedId) {
    const resource = getResourceById(selectedId);
    const reasonEntry = forThisWeek.find((s) => s.resource.id === selectedId);
    const reason = reasonEntry ? `Because "${reasonEntry.matches[0]}" came up this week` : null;
    return (
      <ResourceDetail resource={resource} reason={reason} onBack={() => setSelectedId(null)} onWriteEntry={onWriteEntry} />
    );
  }

  return (
    <>
      <div className="emote-banner-warn mb-8 flex items-start gap-3" role="alert">
        <Heart className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p>
          <strong className="font-semibold text-emote-ink">In crisis, or someone may be in danger?</strong>{' '}
          <span className="text-emote-ink/95">Please contact your local emergency number or a crisis line.</span>
        </p>
      </div>

      {forThisWeek.length > 0 ? (
        <>
          <p className="mb-3 text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">For this week</p>
          <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {forThisWeek.map(({ resource, matches }) => (
              <button
                key={resource.id}
                type="button"
                onClick={() => setSelectedId(resource.id)}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 text-left shadow-emote transition hover:border-emote-border-strong"
              >
                <p className="text-emote-caption text-emote-ink-faint">Because &ldquo;{matches[0]}&rdquo; came up this week</p>
                <h3 className="mt-2 text-emote-section font-semibold text-emote-ink">{resource.title}</h3>
                <p className="mt-2 text-emote-muted text-emote-ink-soft">{resource.description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-emote-muted font-semibold text-emote-accent">
                  {resource.type} &middot; {resource.minutes} min <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-emote-page font-semibold text-emote-ink">All topics</h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-emote-caption font-semibold transition',
                filter === f ? 'border-emote-accent text-emote-accent' : 'border-border text-emote-ink-soft hover:border-emote-border-strong',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ul className="list-none divide-y divide-border border-t border-border">
        {filtered.map((resource) => (
          <li key={resource.id}>
            <button
              type="button"
              onClick={() => setSelectedId(resource.id)}
              className="flex w-full items-center gap-4 py-5 text-left transition hover:bg-accent/40"
            >
              <span className="w-28 shrink-0 text-emote-muted text-emote-ink-faint">
                {resource.type} &middot; {resource.minutes} min
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-emote-card-title font-semibold text-emote-ink">{resource.title}</span>
                <span className="block text-emote-muted text-emote-ink-soft">{resource.description}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-emote-ink-faint" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

export default ResourcesPanel;
