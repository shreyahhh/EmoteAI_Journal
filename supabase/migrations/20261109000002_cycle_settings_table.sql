-- Migration: cycle_settings_table
-- One row per user holding the Cycle v2 mini-app's own settings: the
-- cycle/period length used for predictions until enough real history
-- exists, the irregular-cycle flag, reminder preferences, and whether
-- Cycle is enabled at all. Reached from Emote's main Settings modal, not a
-- separate screen inside Cycle.

do $$ begin raise notice '>>> Running migration: 20261109000002_cycle_settings_table'; end $$;

create table if not exists public.cycle_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  avg_cycle_length smallint not null default 28 check (avg_cycle_length between 21 and 45),
  avg_period_length smallint not null default 5 check (avg_period_length between 2 and 10),
  irregular boolean not null default false,
  enabled boolean not null default true,
  period_reminder_enabled boolean not null default false,
  period_reminder_days_before smallint not null default 2 check (period_reminder_days_before between 0 and 7),
  daily_reminder_enabled boolean not null default false,
  daily_reminder_time time not null default '21:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- public.set_updated_at() already exists — created in 20260829000009_goals_table.sql.
drop trigger if exists tr_cycle_settings_updated_at on public.cycle_settings;
create trigger tr_cycle_settings_updated_at
  before update on public.cycle_settings
  for each row
  execute function public.set_updated_at();

alter table public.cycle_settings enable row level security;

drop policy if exists "cycle_settings_select_own" on public.cycle_settings;
create policy "cycle_settings_select_own"
  on public.cycle_settings for select
  using (auth.uid() = user_id);

drop policy if exists "cycle_settings_insert_own" on public.cycle_settings;
create policy "cycle_settings_insert_own"
  on public.cycle_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "cycle_settings_update_own" on public.cycle_settings;
create policy "cycle_settings_update_own"
  on public.cycle_settings for update
  using (auth.uid() = user_id);

drop policy if exists "cycle_settings_delete_own" on public.cycle_settings;
create policy "cycle_settings_delete_own"
  on public.cycle_settings for delete
  using (auth.uid() = user_id);

do $$ begin raise notice '<<< Completed migration: 20261109000002_cycle_settings_table'; end $$;
