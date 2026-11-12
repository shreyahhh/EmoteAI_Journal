import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, mapPlanetStateRow, mapPlanetAssignmentRow, mapGoalRow } from '../../../supabaseClient';
import { cn } from '../../../lib/utils';
import { PLANETS } from '../models/galaxyPlanetsConfig';
import PlanetDetailModal from './PlanetDetailModal';

// Stage 0 (not yet visible) .. 5 (max growth, PRD: "capped so no planet dominates").
const SIZE_SCALE_BY_STAGE = [0.7, 0.8, 0.9, 1, 1.12, 1.25];
const EMPTY_STATE = { entryCount: 0, sizeStage: 0, avgMood: null, lastEntryAt: null, visible: false };
const PLANET_COUNT = PLANETS.length;

const wrapIndex = (i) => ((i % PLANET_COUNT) + PLANET_COUNT) % PLANET_COUNT;

export default function GalaxyView({ entries, user }) {
  const [planetState, setPlanetState] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [detailPlanetId, setDetailPlanetId] = useState(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    const [stateRes, assignRes, goalsRes] = await Promise.all([
      supabase.from('planet_state').select('*').eq('user_id', user.id),
      supabase.from('planet_assignments').select('entry_id, user_id, planet, is_primary, score, source, created_at').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
    ]);
    const byPlanet = {};
    (stateRes.data || []).forEach((row) => {
      byPlanet[row.planet] = mapPlanetStateRow(row);
    });
    setPlanetState(byPlanet);
    setAssignments((assignRes.data || []).map(mapPlanetAssignmentRow));
    setGoals((goalsRes.data || []).map(mapGoalRow));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const entriesById = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

  const entriesByPlanet = useMemo(() => {
    const map = {};
    for (const p of PLANETS) map[p.id] = [];
    for (const a of assignments) {
      const entry = entriesById.get(a.entryId);
      if (entry && map[a.planet]) map[a.planet].push(entry);
    }
    return map;
  }, [assignments, entriesById]);

  const stateFor = (planetId) => planetState[planetId] || EMPTY_STATE;
  const anyVisible = PLANETS.some((p) => stateFor(p.id).visible);
  const goTo = (index) => setFocusedIndex(wrapIndex(index));

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-emote-muted text-emote-ink-faint">Loading your galaxy…</div>;
  }

  const detailPlanet = PLANETS.find((p) => p.id === detailPlanetId) || null;

  return (
    <div className="galaxy-root">
      {!anyVisible && (
        <p className="mb-6 text-center text-emote-muted text-emote-ink-faint">Planets appear as your life takes shape.</p>
      )}

      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-center gap-1 sm:gap-4">
          <button
            type="button"
            onClick={() => goTo(focusedIndex - 1)}
            aria-label="Previous planet"
            className="shrink-0 rounded-none p-2 text-emote-ink-faint transition hover:text-emote-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex min-h-[340px] flex-1 items-start justify-center gap-3 overflow-hidden sm:gap-10">
            {[-1, 0, 1].map((offset) => {
              const index = wrapIndex(focusedIndex + offset);
              const planet = PLANETS[index];
              const state = stateFor(planet.id);
              const isFocused = offset === 0;
              const planetSize = (isFocused ? 128 : 76) * SIZE_SCALE_BY_STAGE[state.visible ? state.sizeStage : 0];
              const outlineSize = (isFocused ? 128 : 76) * SIZE_SCALE_BY_STAGE[0];

              return (
                <button
                  key={planet.id}
                  type="button"
                  onClick={() => (isFocused ? setDetailPlanetId(planet.id) : goTo(index))}
                  aria-label={isFocused ? `${planet.label} — view details` : `Focus on ${planet.label}`}
                  className={cn(
                    'flex shrink-0 flex-col items-center rounded-none transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isFocused ? 'w-44 opacity-100 sm:w-64' : 'w-24 opacity-35 hover:opacity-60 sm:w-36',
                  )}
                >
                  <div className={cn('flex w-full flex-col-reverse items-center gap-3 md:flex-col')}>
                    {state.visible ? (
                      <img
                        src={planet.image}
                        alt=""
                        draggable={false}
                        style={{ width: planetSize, height: planetSize }}
                        className="block rounded-full"
                      />
                    ) : (
                      <span
                        className="block rounded-full border border-dashed border-emote-border-strong/60"
                        style={{ width: outlineSize, height: outlineSize }}
                      />
                    )}
                    {isFocused && (
                      <div className="text-center">
                        <h3 className="font-display text-emote-card-title font-semibold uppercase tracking-wider text-foreground">
                          {planet.label}
                        </h3>
                        <p className="mt-0.5 text-emote-muted text-emote-ink-faint">{planet.quality}</p>
                        {state.visible && (
                          <p className="mt-1 text-emote-caption text-emote-ink-faint">
                            {state.entryCount} {state.entryCount === 1 ? 'entry' : 'entries'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => goTo(focusedIndex + 1)}
            aria-label="Next planet"
            className="shrink-0 rounded-none p-2 text-emote-ink-faint transition hover:text-emote-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {detailPlanet && (
        <PlanetDetailModal
          planet={detailPlanet}
          entries={entriesByPlanet[detailPlanet.id] || []}
          goals={goals}
          user={user}
          onClose={() => setDetailPlanetId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
