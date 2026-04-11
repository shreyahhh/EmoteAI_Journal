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
