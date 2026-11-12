import { useEffect, useRef } from 'react';
import { supabase, mapCyclePeriodRow, mapCycleSettingsRow } from '../../supabaseClient';
import { toLocalDateKey } from '../models/entryDates';
import { computeCycleState } from '../../features/cycle/models/cycleCalculations';

const CHECK_INTERVAL_MS = 30 * 1000;
const CYCLE_DATA_REFRESH_MS = 5 * 60 * 1000; // periods/settings change rarely; no need to refetch every tick
const JOURNAL_FIRED_KEY = 'emote:reminderFiredOn';
const CYCLE_PERIOD_FIRED_KEY = 'emote:cyclePeriodReminderFiredOn';
const CYCLE_DAILY_FIRED_KEY = 'emote:cycleDailyReminderFiredOn';

function hasEntryToday(entries, todayKey) {
  return entries.some((e) => e.createdAt && toLocalDateKey(new Date(e.createdAt)) === todayKey);
}

async function hasCycleLogToday(userId, todayKey) {
  if (!supabase || !userId) return false;
  const { data } = await supabase
    .from('cycle_daily_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('log_date', todayKey)
    .maybeSingle();
  return Boolean(data);
}

async function loadCycleReminderInputs(userId) {
  if (!supabase || !userId) return null;
  const [periodsRes, settingsRes] = await Promise.all([
    supabase.from('cycle_periods').select('*').eq('user_id', userId).order('start_date', { ascending: true }).limit(400),
    supabase.from('cycle_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  const periods = (periodsRes.data || []).map(mapCyclePeriodRow);
  const settings = mapCycleSettingsRow(settingsRes.data);
  if (!settings.enabled) return null;
  return { periods, settings };
}

function notify(title, body) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body, icon: '/logo192.png', tag: title });
  } catch {
    // Some mobile browsers only allow notifications via a service worker
    // registration; silently skip rather than throw and break the app.
  }
}

/**
 * Fires the evening journal reminder and, for cycle tracking, the daily
 * check-in nudge — entirely client-side via the Notification API while a
 * tab is open (no server push). Each kind dedupes itself per calendar day
 * in localStorage so it fires at most once even if the interval overlaps
 * the target minute more than once.
 */
export function useReminderScheduler({ user, profile, entries }) {
  const stateRef = useRef({});
  stateRef.current = { user, profile, entries };
  const cycleCacheRef = useRef({ loadedAt: 0, userId: null, data: null });

  useEffect(() => {
    const tick = async () => {
      const { user: u, profile: p, entries: es } = stateRef.current;
      if (!u?.id || !p || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

      const now = new Date();
      const todayKey = toLocalDateKey(now);
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dow = now.getDay();

      if (
        p.reminderEnabled &&
        p.reminderTime === hhmm &&
        (p.reminderDays || []).includes(dow) &&
        !hasEntryToday(es || [], todayKey) &&
        localStorage.getItem(JOURNAL_FIRED_KEY) !== todayKey
      ) {
        notify('Emote', "Tonight isn't written yet — write to keep your streak going.");
        localStorage.setItem(JOURNAL_FIRED_KEY, todayKey);
      }

      if (p.sex !== 'female') return;

      const cache = cycleCacheRef.current;
      const stale = cache.userId !== u.id || Date.now() - cache.loadedAt > CYCLE_DATA_REFRESH_MS;
      if (stale) {
        cache.data = await loadCycleReminderInputs(u.id);
        cache.loadedAt = Date.now();
        cache.userId = u.id;
      }
      if (!cache.data) return;

      const { periods, settings } = cache.data;

      if (settings.dailyReminderEnabled && settings.dailyReminderTime === hhmm && localStorage.getItem(CYCLE_DAILY_FIRED_KEY) !== todayKey) {
        const alreadyLogged = await hasCycleLogToday(u.id, todayKey);
        if (!alreadyLogged) {
          notify('Emote · Cycle', 'How are you feeling today? Log your cycle check-in.');
          localStorage.setItem(CYCLE_DAILY_FIRED_KEY, todayKey);
        }
      }

      if (settings.periodReminderEnabled && localStorage.getItem(CYCLE_PERIOD_FIRED_KEY) !== todayKey) {
        const state = computeCycleState(periods, settings, todayKey);
        if (state.hasData && !state.predictions.currentPeriod) {
          if (state.predictions.daysUntilNextPeriod === settings.periodReminderDaysBefore) {
            notify(
              'Emote · Cycle',
              settings.periodReminderDaysBefore === 0
                ? 'Your period may start today.'
                : `Your period may start in about ${settings.periodReminderDaysBefore} day${settings.periodReminderDaysBefore === 1 ? '' : 's'}.`,
            );
            localStorage.setItem(CYCLE_PERIOD_FIRED_KEY, todayKey);
          }
        }
      }
    };

    tick();
    const id = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
