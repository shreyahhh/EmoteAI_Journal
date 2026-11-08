-- Migration: cycle_daily_logs_table
-- One row per calendar day of a per-day cycle check-in (flow, pain, body
-- symptoms, mood, energy, cravings, products) — separate from
-- cycle_periods, which only marks a period's start/end date range. This is
-- what the Cycle page's "Today's check-in" saves, and what the reminder
-- copy ("did your period start?" / "how are you?") is nudging toward.

do $$ begin raise notice '>>> Running migration: 20261108000002_cycle_daily_logs_table'; end $$;

create table if not exists public.cycle_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  flow text check (flow is null or flow in ('none', 'spotting', 'light', 'medium', 'heavy')),
  pain text check (pain is null or pain in ('mild', 'moderate', 'severe')),
  symptoms text[] not null default '{}',
  mood text[] not null default '{}',
  energy text[] not null default '{}',
  cravings text[] not null default '{}',
  products text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists cycle_daily_logs_user_date_idx
  on public.cycle_daily_logs (user_id, log_date desc);

-- public.set_updated_at() already exists — created in 20260829000009_goals_table.sql.
drop trigger if exists tr_cycle_daily_logs_updated_at on public.cycle_daily_logs;
create trigger tr_cycle_daily_logs_updated_at
  before update on public.cycle_daily_logs
  for each row
  execute function public.set_updated_at();

alter table public.cycle_daily_logs enable row level security;

drop policy if exists "cycle_daily_logs_select_own" on public.cycle_daily_logs;
create policy "cycle_daily_logs_select_own"
  on public.cycle_daily_logs for select
  using (auth.uid() = user_id);

drop policy if exists "cycle_daily_logs_insert_own" on public.cycle_daily_logs;
create policy "cycle_daily_logs_insert_own"
  on public.cycle_daily_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "cycle_daily_logs_update_own" on public.cycle_daily_logs;
create policy "cycle_daily_logs_update_own"
  on public.cycle_daily_logs for update
  using (auth.uid() = user_id);

drop policy if exists "cycle_daily_logs_delete_own" on public.cycle_daily_logs;
create policy "cycle_daily_logs_delete_own"
  on public.cycle_daily_logs for delete
  using (auth.uid() = user_id);

do $$ begin raise notice '<<< Completed migration: 20261108000002_cycle_daily_logs_table'; end $$;
