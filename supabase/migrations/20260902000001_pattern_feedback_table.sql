-- Migration: pattern_feedback_table
-- Captures a thumbs up/down per user on the cards shown in Insights →
-- Patterns (lib/patternAnalysis.js). One standing verdict per
-- (user, pattern_id) — voting again updates it rather than piling up rows.
--
-- This exists because there is no ground truth to compute real precision
-- against for these detectors today (see conversation) — this is how that
-- signal starts getting collected. It captures "is this kind of insight
-- useful to you", not per-instance prediction accuracy: pattern_id is a
-- stable detector key (e.g. "trend", "weekday", "theme-Work Stress"), the
-- same key every time that detector fires for a user, so a vote reflects
-- their standing opinion of that insight type rather than one occurrence.

do $$ begin raise notice '>>> Running migration: 20260902000001_pattern_feedback_table'; end $$;

create table if not exists public.pattern_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern_id text not null,
  pattern_type text not null,
  verdict text not null check (verdict in ('up', 'down')),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, pattern_id)
);

comment on column public.pattern_feedback.pattern_id is 'Stable detector key, e.g. trend, weekday, theme-Work Stress.';
comment on column public.pattern_feedback.pattern_type is 'Detector family: trend, weekday, theme, activity, streak.';
comment on column public.pattern_feedback.snapshot is 'Pattern card content at the time of voting (title/description/metric), kept for later review without recomputing history.';

create index if not exists pattern_feedback_user_idx on public.pattern_feedback (user_id);

-- public.set_updated_at() already exists — created in 20260829000009_goals_table.sql.
drop trigger if exists tr_pattern_feedback_updated_at on public.pattern_feedback;
create trigger tr_pattern_feedback_updated_at
  before update on public.pattern_feedback
  for each row
  execute function public.set_updated_at();

alter table public.pattern_feedback enable row level security;

drop policy if exists "pattern_feedback_select_own" on public.pattern_feedback;
create policy "pattern_feedback_select_own"
  on public.pattern_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "pattern_feedback_insert_own" on public.pattern_feedback;
create policy "pattern_feedback_insert_own"
  on public.pattern_feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "pattern_feedback_update_own" on public.pattern_feedback;
create policy "pattern_feedback_update_own"
  on public.pattern_feedback for update
  using (auth.uid() = user_id);

drop policy if exists "pattern_feedback_delete_own" on public.pattern_feedback;
create policy "pattern_feedback_delete_own"
  on public.pattern_feedback for delete
  using (auth.uid() = user_id);

do $$ begin raise notice '<<< Completed migration: 20260902000001_pattern_feedback_table'; end $$;
