import { createClient } from '@supabase/supabase-js';

/** Strip quotes/BOM; trim — common .env paste issues */
function normalizeEnvValue(value) {
  if (value == null || typeof value !== 'string') return '';
  let t = value.trim().replace(/^\uFEFF/, '');
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

const rawUrl = normalizeEnvValue(process.env.REACT_APP_SUPABASE_URL);
const rawKey = normalizeEnvValue(process.env.REACT_APP_SUPABASE_ANON_KEY);

function isPlaceholderSupabaseUrl(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('your_project_ref') ||
    lower.includes('your-project-ref') ||
    lower.includes('placeholder') ||
    lower.includes('example.com') ||
    lower.includes('xxxxx')
  );
}

function isValidSupabaseUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    if (isPlaceholderSupabaseUrl(url)) return false;
    return h.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export function getSupabaseConfigIssue() {
  if (!rawUrl && !rawKey) {
    return 'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY) in frontend-new/.env.local or the repo root .env, then restart npm start.';
  }
  if (!rawUrl) {
    return 'Missing Supabase URL. Set REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co (from Supabase → Project Settings → API).';
  }
  if (!rawKey) {
    return 'Missing Supabase anon key. Set REACT_APP_SUPABASE_ANON_KEY (Project Settings → API → anon public).';
  }
  if (!isValidSupabaseUrl(rawUrl)) {
    return `Invalid Supabase URL. Use your real project URL: https://<project-ref>.supabase.co — not a placeholder. Current value starts with: "${rawUrl.slice(0, 28)}…"`;
  }
  return null;
}

let supabase;

const configIssue = getSupabaseConfigIssue();

if (configIssue) {
  console.warn('[Emote]', configIssue);
  supabase = null;
} else {
  supabase = createClient(rawUrl, rawKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export { supabase };

/** Map DB row to the shape used across the app (camelCase + userId). */
export function mapJournalRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? '',
    content: row.content ?? '',
    sentimentScore: row.sentiment_score != null ? Number(row.sentiment_score) : null,
    emotions: row.emotions ?? [],
    themes: row.themes ?? [],
    activities: row.activities ?? [],
    activityLabels: row.activity_labels && typeof row.activity_labels === 'object' ? row.activity_labels : {},
    mood: row.mood ?? 'neutral',
    analysis: row.analysis && typeof row.analysis === 'object' ? row.analysis : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapHistoryRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    journalEntryId: row.journal_entry_id,
    userId: row.user_id,
    eventType: row.event_type,
    title: row.title,
    content: row.content,
    sentimentScore: row.sentiment_score != null ? Number(row.sentiment_score) : null,
    emotions: row.emotions ?? [],
    themes: row.themes ?? [],
    activities: row.activities ?? [],
    activityLabels: row.activity_labels && typeof row.activity_labels === 'object' ? row.activity_labels : {},
    mood: row.mood,
    createdAt: row.created_at,
  };
}

/** Map profiles row (extended fields optional until migration runs). */
export function mapProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email ?? '',
    displayName: row.display_name ?? '',
    username: row.username ?? '',
    age: row.age != null ? Number(row.age) : null,
    sex: row.sex ?? null,
    profileCompletedAt: row.profile_completed_at ?? null,
    reminderEnabled: row.reminder_enabled ?? false,
    reminderTime: row.reminder_time ?? '21:00',
    reminderDays: Array.isArray(row.reminder_days) ? row.reminder_days : [1, 2, 3, 4, 5],
    planetNotificationsEnabled: row.planet_notifications_enabled ?? true,
    updatedAt: row.updated_at,
  };
}

/** Goal row: a habit title plus a map of 'YYYY-MM-DD' -> completed. */
export function mapGoalRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? '',
    targetPerWeek: row.target_per_week != null ? Number(row.target_per_week) : 3,
    completions: row.completions && typeof row.completions === 'object' ? row.completions : {},
    planet: row.planet ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Pattern feedback row: one standing thumbs up/down per (user, pattern). */
export function mapPatternFeedbackRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    patternId: row.pattern_id,
    patternType: row.pattern_type,
    verdict: row.verdict,
    snapshot: row.snapshot && typeof row.snapshot === 'object' ? row.snapshot : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Period row: calendar start/end + symptoms + reflections. */
export function mapCyclePeriodRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    startDate: row.start_date,
    endDate: row.end_date ?? null,
    moodReflection: row.mood_reflection ?? '',
    symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a cycle_daily_logs row — one day's cycle check-in. */
export function mapCycleDailyLogRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    logDate: row.log_date,
    flow: row.flow ?? null,
    pain: row.pain ?? null,
    mood: Array.isArray(row.mood) ? row.mood : [],
    symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
    sleep: row.sleep ?? null,
    cravings: Array.isArray(row.cravings) ? row.cravings : [],
    discharge: row.discharge ?? null,
    products: Array.isArray(row.products) ? row.products : [],
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a cycle_settings row — one per user, the Cycle mini-app's own prefs. */
export function mapCycleSettingsRow(row) {
  if (!row) {
    return {
      avgCycleLength: 28,
      avgPeriodLength: 5,
      irregular: false,
      enabled: true,
      periodReminderEnabled: false,
      periodReminderDaysBefore: 2,
      dailyReminderEnabled: false,
      dailyReminderTime: '21:00',
    };
  }
  return {
    userId: row.user_id,
    avgCycleLength: row.avg_cycle_length ?? 28,
    avgPeriodLength: row.avg_period_length ?? 5,
    irregular: row.irregular ?? false,
    enabled: row.enabled ?? true,
    periodReminderEnabled: row.period_reminder_enabled ?? false,
    periodReminderDaysBefore: row.period_reminder_days_before ?? 2,
    dailyReminderEnabled: row.daily_reminder_enabled ?? false,
    dailyReminderTime: (row.daily_reminder_time ?? '21:00').slice(0, 5),
    updatedAt: row.updated_at,
  };
}

/** Map a planet_state row — one per (user, planet), maintained after every entry save/edit/delete. */
export function mapPlanetStateRow(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    planet: row.planet,
    entryCount: row.entry_count ?? 0,
    sizeStage: row.size_stage ?? 0,
    avgMood: row.avg_mood != null ? Number(row.avg_mood) : null,
    lastEntryAt: row.last_entry_at ?? null,
    visible: row.visible ?? false,
    updatedAt: row.updated_at,
  };
}

/** Map a planet_assignments row — which entry joined which planet, and why. */
export function mapPlanetAssignmentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    entryId: row.entry_id,
    planet: row.planet,
    score: row.score != null ? Number(row.score) : 0,
    isPrimary: row.is_primary ?? false,
    source: row.source ?? 'ai',
    createdAt: row.created_at,
  };
}
