-- Run in Supabase SQL Editor after base schema (or alongside profile column alters).
-- Adds profile fields + cycle_periods (calendar period start/end, symptoms, notes).

-- ---------------------------------------------------------------------------
-- Profile columns
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists age smallint;
alter table public.profiles add column if not exists sex text
  check (sex is null or sex in ('female', 'male', 'non_binary', 'prefer_not_say', 'other'));
alter table public.profiles add column if not exists profile_completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- cycle_periods (replaces legacy cycle_logs if you had the earlier experiment)
-- ---------------------------------------------------------------------------
create table if not exists public.cycle_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date,
  mood_reflection text not null default '',
  symptoms text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists cycle_periods_user_start_idx
  on public.cycle_periods (user_id, start_date desc);

alter table public.cycle_periods enable row level security;

drop policy if exists "cycle_periods_select_own" on public.cycle_periods;
create policy "cycle_periods_select_own"
  on public.cycle_periods for select
  using (auth.uid() = user_id);

drop policy if exists "cycle_periods_insert_own" on public.cycle_periods;
create policy "cycle_periods_insert_own"
  on public.cycle_periods for insert
  with check (auth.uid() = user_id);

drop policy if exists "cycle_periods_update_own" on public.cycle_periods;
create policy "cycle_periods_update_own"
  on public.cycle_periods for update
  using (auth.uid() = user_id);

drop policy if exists "cycle_periods_delete_own" on public.cycle_periods;
create policy "cycle_periods_delete_own"
  on public.cycle_periods for delete
  using (auth.uid() = user_id);
