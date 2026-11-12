-- Migration: goals_target_per_week
-- Adds a weekly target to each habit so the Streak & habits page can show
-- "X of N this week" progress instead of a single daily toggle only.

do $$ begin raise notice '>>> Running migration: 20261109000001_goals_target_per_week'; end $$;

alter table public.goals
  add column if not exists target_per_week smallint not null default 3;

alter table public.goals
  drop constraint if exists goals_target_per_week_range;

alter table public.goals
  add constraint goals_target_per_week_range check (target_per_week between 1 and 7);

do $$ begin raise notice '<<< Completed migration: 20261109000001_goals_target_per_week'; end $$;
