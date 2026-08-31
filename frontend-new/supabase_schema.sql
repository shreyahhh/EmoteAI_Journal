-- EmoteAI Journal — Supabase schema, RLS, history triggers, realtime
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query) as a single script.
--
-- After running once:
-- • If `alter publication supabase_realtime add table` errors with "already member", skip those two lines.
-- • If the `auth.users` trigger fails (permissions), create profiles manually or sync from the app later.
-- • Enable Email auth under Authentication → Providers in the Supabase dashboard.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user; optional display fields later)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  username text,
  age smallint,
  sex text check (sex is null or sex in ('female', 'male', 'non_binary', 'prefer_not_say', 'other')),
  profile_completed_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App profile row linked to auth.users; extended metadata per user.';

-- ---------------------------------------------------------------------------
-- Journal entries (current row per entry; all labels stored explicitly)
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  content text not null default '',
  sentiment_score double precision,
  emotions text[] not null default '{}',
  themes text[] not null default '{}',
  activities text[] not null default '{}',
  activity_labels jsonb not null default '{}'::jsonb,
  mood text not null default 'neutral'
    check (mood in ('happy', 'sad', 'angry', 'anxious', 'neutral')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.journal_entries.activities is 'Activity category keys, e.g. exercise, work.';
comment on column public.journal_entries.activity_labels is 'Map of activity key -> display label at save time for charts/export.';
comment on column public.journal_entries.emotions is 'Gemini emotion labels for this entry.';
comment on column public.journal_entries.themes is 'Gemini theme/topic labels for this entry.';

create index if not exists journal_entries_user_created_idx
  on public.journal_entries (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Cycle periods (optional; app shows Cycle tab only when sex = female)
-- Mark period start/end on calendar; symptoms + notes stored per period.
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

-- ---------------------------------------------------------------------------
-- Append-only history (every create/update/delete of a journal entry)
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entry_history (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type in ('create', 'update', 'delete')),
  title text,
  content text,
  sentiment_score double precision,
  emotions text[] not null default '{}',
  themes text[] not null default '{}',
  activities text[] not null default '{}',
  activity_labels jsonb not null default '{}'::jsonb,
  mood text,
  created_at timestamptz not null default now()
);

create index if not exists journal_entry_history_entry_idx
  on public.journal_entry_history (journal_entry_id, created_at desc);

create index if not exists journal_entry_history_user_idx
  on public.journal_entry_history (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_journal_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tr_journal_entries_updated_at on public.journal_entries;
create trigger tr_journal_entries_updated_at
  before update on public.journal_entries
  for each row
  execute function public.set_journal_entries_updated_at();

-- ---------------------------------------------------------------------------
-- History: insert on create / update
-- ---------------------------------------------------------------------------
create or replace function public.journal_entry_history_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.journal_entry_history (
      journal_entry_id, user_id, event_type,
      title, content, sentiment_score, emotions, themes, activities, activity_labels, mood
    ) values (
      new.id, new.user_id, 'create',
      new.title, new.content, new.sentiment_score, new.emotions, new.themes, new.activities, new.activity_labels, new.mood
    );
  elsif tg_op = 'UPDATE' then
    insert into public.journal_entry_history (
      journal_entry_id, user_id, event_type,
      title, content, sentiment_score, emotions, themes, activities, activity_labels, mood
    ) values (
      new.id, new.user_id, 'update',
      new.title, new.content, new.sentiment_score, new.emotions, new.themes, new.activities, new.activity_labels, new.mood
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tr_journal_entries_history_aiu on public.journal_entries;
create trigger tr_journal_entries_history_aiu
  after insert or update on public.journal_entries
  for each row
  execute function public.journal_entry_history_after_write();

-- ---------------------------------------------------------------------------
-- History: snapshot before delete
-- ---------------------------------------------------------------------------
create or replace function public.journal_entry_history_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.journal_entry_history (
    journal_entry_id, user_id, event_type,
    title, content, sentiment_score, emotions, themes, activities, activity_labels, mood
  ) values (
    old.id, old.user_id, 'delete',
    old.title, old.content, old.sentiment_score, old.emotions, old.themes, old.activities, old.activity_labels, old.mood
  );
  return old;
end;
$$;

drop trigger if exists tr_journal_entries_history_bd on public.journal_entries;
create trigger tr_journal_entries_history_bd
  before delete on public.journal_entries
  for each row
  execute function public.journal_entry_history_before_delete();

-- ---------------------------------------------------------------------------
-- New auth user → profile row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_entry_history enable row level security;
alter table public.cycle_periods enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Cycle periods
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

-- Journal entries
drop policy if exists "journal_select_own" on public.journal_entries;
create policy "journal_select_own"
  on public.journal_entries for select
  using (auth.uid() = user_id);

drop policy if exists "journal_insert_own" on public.journal_entries;
create policy "journal_insert_own"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "journal_update_own" on public.journal_entries;
create policy "journal_update_own"
  on public.journal_entries for update
  using (auth.uid() = user_id);

drop policy if exists "journal_delete_own" on public.journal_entries;
create policy "journal_delete_own"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- History (read-only for users; writes come from triggers as SECURITY DEFINER)
drop policy if exists "journal_history_select_own" on public.journal_entry_history;
create policy "journal_history_select_own"
  on public.journal_entry_history for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Realtime (for live dashboard updates)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.journal_entries;
alter publication supabase_realtime add table public.journal_entry_history;
