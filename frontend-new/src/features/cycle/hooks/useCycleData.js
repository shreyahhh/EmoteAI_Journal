import { useCallback, useEffect, useState } from 'react';
import { supabase, mapCyclePeriodRow, mapCycleDailyLogRow, mapCycleSettingsRow } from '../../../supabaseClient';
import { toLocalDateKey } from '../../../lib/models/entryDates';
import { computeCycleState } from '../models/cycleCalculations';

const emptyDailyLog = (logDate) => ({
  logDate,
  flow: null,
  pain: null,
  mood: [],
  symptoms: [],
  sleep: null,
  cravings: [],
  discharge: null,
  products: [],
  notes: '',
});

/**
 * Owns all of Cycle's own data (periods, daily logs, settings) independent
 * of Dashboard — Cycle fetches and mutates its own tables so it stays a
 * self-contained mini-app. Exposes the derived cycle state (phase,
 * predictions) alongside the raw rows.
 */
export function useCycleData(user) {
  const [periods, setPeriods] = useState([]);
  const [dailyLogsByDate, setDailyLogsByDate] = useState({});
  const [settings, setSettings] = useState(mapCycleSettingsRow(null));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    if (!supabase || !user?.id) {
      setPeriods([]);
      setDailyLogsByDate({});
      setSettings(mapCycleSettingsRow(null));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const [periodsRes, logsRes, settingsRes] = await Promise.all([
      supabase.from('cycle_periods').select('*').eq('user_id', user.id).order('start_date', { ascending: true }).limit(400),
      supabase
        .from('cycle_daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true })
        .limit(2000),
      supabase.from('cycle_settings').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    if (periodsRes.error) setError(periodsRes.error.message || 'Could not load periods.');
    else setPeriods((periodsRes.data || []).map(mapCyclePeriodRow));

    if (!logsRes.error) {
      const byDate = {};
      (logsRes.data || []).forEach((row) => {
        const mapped = mapCycleDailyLogRow(row);
        byDate[mapped.logDate] = mapped;
      });
      setDailyLogsByDate(byDate);
    }

    if (!settingsRes.error) setSettings(mapCycleSettingsRow(settingsRes.data));

    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const todayKey = toLocalDateKey(new Date());
  const state = computeCycleState(periods, settings, todayKey);

  const getLogFor = useCallback((logDate) => dailyLogsByDate[logDate] || emptyDailyLog(logDate), [dailyLogsByDate]);

  const saveDailyLog = useCallback(
    async (logDate, patch) => {
      if (!supabase || !user?.id) return { error: 'offline' };
      const current = dailyLogsByDate[logDate] || emptyDailyLog(logDate);
      const next = { ...current, ...patch };
      // Optimistic — the sheet/inline panel should feel instant.
      setDailyLogsByDate((prev) => ({ ...prev, [logDate]: next }));
      const { error: upsertError } = await supabase.from('cycle_daily_logs').upsert(
        {
          user_id: user.id,
          log_date: logDate,
          flow: next.flow,
          pain: next.pain,
          mood: next.mood,
          symptoms: next.symptoms,
          sleep: next.sleep,
          cravings: next.cravings,
          discharge: next.discharge,
          products: next.products,
          notes: next.notes || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,log_date' },
      );
      if (upsertError) {
        setDailyLogsByDate((prev) => ({ ...prev, [logDate]: current }));
        return { error: upsertError.message };
      }
      return { error: null };
    },
    [supabase, user?.id, dailyLogsByDate],
  );

  const startPeriodToday = useCallback(
    async (startDate = todayKey) => {
      if (!supabase || !user?.id) return { error: 'offline' };
      const { error: insertError } = await supabase
        .from('cycle_periods')
        .insert({ user_id: user.id, start_date: startDate, end_date: null });
      if (insertError) return { error: insertError.message };
      await loadAll();
      return { error: null };
    },
    [supabase, user?.id, todayKey, loadAll],
  );

  const endPeriod = useCallback(
    async (periodId, endDate = todayKey) => {
      if (!supabase || !user?.id || !periodId) return { error: 'offline' };
      const { error: updateError } = await supabase
        .from('cycle_periods')
        .update({ end_date: endDate })
        .eq('id', periodId)
        .eq('user_id', user.id);
      if (updateError) return { error: updateError.message };
      await loadAll();
      return { error: null };
    },
    [supabase, user?.id, todayKey, loadAll],
  );

  const savePeriodRange = useCallback(
    async ({ id, startDate, endDate }) => {
      if (!supabase || !user?.id) return { error: 'offline' };
      const row = { user_id: user.id, start_date: startDate, end_date: endDate || null };
      const { error: saveError } = id
        ? await supabase.from('cycle_periods').update(row).eq('id', id).eq('user_id', user.id)
        : await supabase.from('cycle_periods').insert(row);
      if (saveError) return { error: saveError.message };
      await loadAll();
      return { error: null };
    },
    [supabase, user?.id, loadAll],
  );

  const deletePeriod = useCallback(
    async (periodId) => {
      if (!supabase || !user?.id || !periodId) return { error: 'offline' };
      const { error: deleteError } = await supabase.from('cycle_periods').delete().eq('id', periodId).eq('user_id', user.id);
      if (deleteError) return { error: deleteError.message };
      await loadAll();
      return { error: null };
    },
    [supabase, user?.id, loadAll],
  );

  const saveSettings = useCallback(
    async (patch) => {
      if (!supabase || !user?.id) return { error: 'offline' };
      const next = { ...settings, ...patch };
      setSettings(next);
      const { error: upsertError } = await supabase.from('cycle_settings').upsert(
        {
          user_id: user.id,
          avg_cycle_length: next.avgCycleLength,
          avg_period_length: next.avgPeriodLength,
          irregular: next.irregular,
          enabled: next.enabled,
          period_reminder_enabled: next.periodReminderEnabled,
          period_reminder_days_before: next.periodReminderDaysBefore,
          daily_reminder_enabled: next.dailyReminderEnabled,
          daily_reminder_time: next.dailyReminderTime,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (upsertError) return { error: upsertError.message };
      return { error: null };
    },
    [supabase, user?.id, settings],
  );

  /** Turn Cycle off: wipe periods + daily logs, keep the settings row (re-enabled, defaults) so setup can run again. */
  const disableAndDeleteAll = useCallback(async () => {
    if (!supabase || !user?.id) return { error: 'offline' };
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('cycle_periods').delete().eq('user_id', user.id),
      supabase.from('cycle_daily_logs').delete().eq('user_id', user.id),
    ]);
    if (e1 || e2) return { error: e1?.message || e2?.message };
    await saveSettings({ enabled: false, irregular: false, avgCycleLength: 28, avgPeriodLength: 5 });
    await loadAll();
    return { error: null };
  }, [supabase, user?.id, saveSettings, loadAll]);

  return {
    isLoading,
    error,
    periods,
    dailyLogs: Object.values(dailyLogsByDate),
    settings,
    todayKey,
    state,
    getLogFor,
    saveDailyLog,
    startPeriodToday,
    endPeriod,
    savePeriodRange,
    deletePeriod,
    saveSettings,
    disableAndDeleteAll,
    refresh: loadAll,
  };
}
