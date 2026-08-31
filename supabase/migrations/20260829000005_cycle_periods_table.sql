-- Migration: cycle_periods_table
-- Optional; the app only shows the Cycle tab when a profile's sex = 'female'.
-- One row per marked period: calendar start/end, symptoms, and notes.

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
