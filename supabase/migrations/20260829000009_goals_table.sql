-- Migration: goals_table
-- Replaces the mock in-memory goals list in GoalsView.jsx with real storage.
-- completions is a map of 'YYYY-MM-DD' -> true, matching the shape the UI
-- already used, so no client-side data model change was needed.

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  completions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_created_idx
  on public.goals (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tr_goals_updated_at on public.goals;
create trigger tr_goals_updated_at
  before update on public.goals
  for each row
  execute function public.set_updated_at();

alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own"
  on public.goals for select
  using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own"
  on public.goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own"
  on public.goals for update
  using (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own"
  on public.goals for delete
  using (auth.uid() = user_id);
