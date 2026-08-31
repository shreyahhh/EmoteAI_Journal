-- Migration: row_level_security
-- Every table is per-user: a row is only visible/writable by its owner
-- (auth.uid() = id, or auth.uid() = user_id). journal_entry_history has no
-- insert/update/delete policy for regular users — it is only ever written
-- by the SECURITY DEFINER trigger functions.

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

-- Journal entry history (read-only for users; writes come from triggers)
drop policy if exists "journal_history_select_own" on public.journal_entry_history;
create policy "journal_history_select_own"
  on public.journal_entry_history for select
  using (auth.uid() = user_id);

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
