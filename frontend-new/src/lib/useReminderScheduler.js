import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toLocalDateKey } from './entryDates';
import { cycleCheckinPrompt } from './cycleForecast';

const CHECK_INTERVAL_MS = 30 * 1000;
const JOURNAL_FIRED_KEY = 'emote:reminderFiredOn';
const CYCLE_FIRED_KEY = 'emote:cycleReminderFiredOn';

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
export function useReminderScheduler({ user, profile, entries, cyclePeriods }) {
  const stateRef = useRef({});
  stateRef.current = { user, profile, entries, cyclePeriods };

  useEffect(() => {
    const tick = async () => {
      const { user: u, profile: p, entries: es, cyclePeriods: cps } = stateRef.current;
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

      if (
        p.sex === 'female' &&
        p.cycleRemindersEnabled &&
        p.reminderTime === hhmm &&
        localStorage.getItem(CYCLE_FIRED_KEY) !== todayKey
      ) {
        const prompt = cycleCheckinPrompt(cps || [], todayKey);
        if (prompt) {
          const alreadyLogged = await hasCycleLogToday(u.id, todayKey);
          if (!alreadyLogged) {
            notify(
              'Emote · Cycle',
              prompt === 'start' ? 'Did your period start today?' : 'How are you feeling today? Log your cycle check-in.',
            );
            localStorage.setItem(CYCLE_FIRED_KEY, todayKey);
          }
        }
      }
    };

    tick();
    const id = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
