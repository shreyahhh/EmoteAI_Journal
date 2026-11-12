# EmoteAI Journal — Supabase migrations

Run these against a **brand new** Supabase project, in order. Every
statement is idempotent (`if not exists`, `drop ... if exists`), so it's
safe to re-run the whole folder if something fails partway through.

| File | Creates |
|---|---|
| `20260829000001_extensions.sql` | `pgcrypto` extension (needed for `gen_random_uuid()`) |
| `20260829000002_profiles_table.sql` | `public.profiles` |
| `20260829000003_journal_entries_table.sql` | `public.journal_entries` + index |
| `20260829000004_journal_entry_history_table.sql` | `public.journal_entry_history` + indexes |
| `20260829000005_cycle_periods_table.sql` | `public.cycle_periods` + index |
| `20260829000006_functions_and_triggers.sql` | `updated_at` trigger, history-logging triggers, new-user → profile trigger |
| `20260829000007_row_level_security.sql` | RLS enabled + per-user policies on all four tables |
| `20260829000008_realtime_publication.sql` | Adds `journal_entries` / `journal_entry_history` to `supabase_realtime` |
| `20260829000009_goals_table.sql` | `public.goals` (real persistence for the Goals tab — was in-memory mock data before) |
| `20260902000001_pattern_feedback_table.sql` | `public.pattern_feedback` (thumbs up/down on Insights → Patterns cards) |
| `20260920000001_journal_entries_replica_identity_full.sql` | Sets `REPLICA IDENTITY FULL` on `journal_entries` so Realtime DELETE events actually reach the client (fixes deleted entries lingering in the UI until reload) |
| `20261008000001_llm_rate_limit.sql` | `public.llm_usage` + `public.llm_rate_limit()`: per-user, per-minute and per-day request counters for the `llm-proxy` function (service role only) |
| `20261007000001_sarcasm_check.sql` | `journal_entries.analysis` (per-line model results) + `public.sarcasm_feedback` (answers to "did you mean that sarcastically?", RLS, opt-in flag for retraining) |
| `20261108000001_profile_reminder_prefs.sql` | `profiles.reminder_enabled` / `reminder_time` / `reminder_days` / `cycle_reminders_enabled` — evening journal reminder + (superseded) cycle check-in opt-in, set during onboarding and in Settings. `cycle_reminders_enabled` is no longer read anywhere — the Cycle v2 redesign replaced it with `cycle_settings.period_reminder_enabled` / `daily_reminder_enabled`; the column is harmless to leave in place |
| `20261108000002_cycle_daily_logs_table.sql` | `public.cycle_daily_logs` — one row per day's cycle check-in (flow/pain/mood/symptoms/sleep/cravings/discharge/products), RLS. Field set is for the Cycle v2 redesign — edited in place since never applied live |
| `20261109000001_goals_target_per_week.sql` | `goals.target_per_week` — weekly target (1–7) for the "X of N this week" habit progress ring on the Streak & habits page |
| `20261109000002_cycle_settings_table.sql` | `public.cycle_settings` — one row per user: avg cycle/period length, irregular flag, enabled flag, period/daily reminder prefs for the Cycle v2 mini-app |
| `20261113000001_planets_tables.sql` | `public.planet_assignments` (which entries joined which planet), `public.planet_state` (one row per user/planet — size, visibility, avg mood, last entry), `public.planet_corrections` (audit log for manual re-assignments), plus `goals.planet` and `profiles.planet_notifications_enabled` — Stars and Planets PRD Part B |

## How to run

**Option A — SQL Editor (simplest):**
Dashboard → SQL → New query → paste each file's contents in order (0001
through 0009) → Run.

**Option B — Supabase CLI:**
```
supabase link --project-ref <your-project-ref>
supabase db push
```
(The filenames already follow the CLI's `<timestamp>_<name>.sql` convention.)

## After running the migrations

1. **Authentication → Providers**: enable **Email**.
2. **Authentication → URL Configuration**: set Site URL to
   `http://localhost:3000` for local dev (add your deployed URL too once
   you have one) so signup confirmation links redirect correctly.
3. **Project Settings → API**: copy the **Project URL** and **anon public**
   key into `frontend-new/.env.local` (and the repo-root `.env.local`):
   ```
   REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=<anon-public-key>
   ```
4. Restart `npm start` so Create React App picks up the new env vars.
5. **Deploy the Gemini proxy Edge Function** (`supabase/functions/gemini-proxy/`).
   The frontend no longer calls Gemini directly — the API key would be
   visible to anyone who opens devtools. All AI calls (journal analysis,
   weekly summary, chat, resource content) now go through this function
   instead, so **journal saving, insights, chat, and resources will not
   produce AI content until this is deployed**:
   ```
   supabase functions deploy gemini-proxy
   supabase secrets set GEMINI_API_KEY=<your-real-gemini-key>
   ```
   `REACT_APP_GEMINI_API_KEY` in `.env.local` is no longer used anywhere
   and can be removed once this is deployed.

## Notes

- `frontend-new/supabase_schema.sql` and
  `frontend-new/supabase_profile_cycle_migration.sql` are the old
  hand-run scripts this folder replaces — everything in both is covered
  here, split into named, ordered migrations. Safe to delete once this
  folder is confirmed working.
