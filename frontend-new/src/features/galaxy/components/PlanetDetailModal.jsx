import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import EntryDetailModal from '../../../components/shared/EntryDetailModal';
import GalaxyMoon from './GalaxyMoon';
import { correctPlanetAssignment } from '../models/galaxyPlanetState';
import { PLANET_IDS } from '../models/galaxyPlanetAssignment';
import { PLANETS_BY_ID } from '../models/galaxyPlanetsConfig';
import { supabase } from '../../../supabaseClient';
import { getCreatedAtDate } from '../../../lib/models/entryDates';

const CHART_MUTED = '#CDBBA3';
const CHART_GRID = '#2A2A36';

/** Quality + mood-over-time + linked entries + goal moons for one planet (PRD section 15 "Tap a planet"). */
export default function PlanetDetailModal({ planet, entries, goals, user, onClose, onChanged }) {
  const [viewingEntry, setViewingEntry] = useState(null);
  const [movingEntryId, setMovingEntryId] = useState(null);
  const [busy, setBusy] = useState(false);

  const sortedEntries = useMemo(
    () => entries.slice().sort((a, b) => (getCreatedAtDate(b) || 0) - (getCreatedAtDate(a) || 0)),
    [entries],
  );

  const moodPoints = useMemo(
    () =>
      entries
        .map((e) => ({ date: getCreatedAtDate(e), score: e.sentimentScore }))
        .filter((p) => p.date && p.score != null)
        .sort((a, b) => a.date - b.date)
        .map((p) => ({ label: p.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), score: p.score })),
    [entries],
  );

  const moons = useMemo(() => goals.filter((g) => g.planet === planet.id), [goals, planet.id]);

  const handleMove = async (entryId, toPlanet) => {
    if (!supabase || !user?.id || busy) return;
    setBusy(true);
    try {
      await correctPlanetAssignment(supabase, user.id, entryId, planet.id, toPlanet);
      setMovingEntryId(null);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{planet.label}</DialogTitle>
          <DialogDescription>{planet.quality}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
          <p className="text-emote-muted text-emote-ink-soft">{planet.traits.join(' · ')}</p>

          {moodPoints.length >= 2 && (
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodPoints} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="label" stroke={CHART_MUTED} tick={{ fill: CHART_MUTED, fontSize: 11 }} />
                  <YAxis domain={[-10, 10]} stroke={CHART_MUTED} tick={{ fill: CHART_MUTED, fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '0px', border: `1px solid ${CHART_GRID}` }} />
                  <Line type="monotone" dataKey="score" name="Mood" stroke="rgb(var(--emote-accent))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {moons.length > 0 && (
            <div>
              <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wider text-emote-ink-faint">Moons</h4>
              <div className="flex flex-wrap gap-2">
                {moons.map((g) => (
                  <GalaxyMoon key={g.id} goal={g} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wider text-emote-ink-faint">
              Entries ({sortedEntries.length})
            </h4>
            {sortedEntries.length === 0 ? (
              <p className="text-emote-muted text-emote-ink-faint">No entries here yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {sortedEntries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <button type="button" onClick={() => setViewingEntry(e)} className="min-w-0 flex-1 text-left">
                      <p className="truncate font-semibold text-emote-ink">{e.title || 'Untitled entry'}</p>
                    </button>
                    {movingEntryId === e.id ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {PLANET_IDS.filter((p) => p !== planet.id).map((p) => (
                          <button
                            key={p}
                            type="button"
                            disabled={busy}
                            onClick={() => handleMove(e.id, p)}
                            className="rounded-none border border-border px-2 py-1 text-emote-caption capitalize transition hover:bg-accent disabled:opacity-50"
                          >
                            {PLANETS_BY_ID[p].label}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleMove(e.id, null)}
                          className="rounded-none border border-border px-2 py-1 text-emote-caption text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                        >
                          Remove
                        </button>
                        <button type="button" onClick={() => setMovingEntryId(null)} className="px-2 py-1 text-emote-caption text-emote-ink-faint">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setMovingEntryId(e.id)}>
                        Move
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>

      {viewingEntry && <EntryDetailModal entry={viewingEntry} onClose={() => setViewingEntry(null)} />}
    </Dialog>
  );
}
