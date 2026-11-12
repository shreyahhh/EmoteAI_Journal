-- Migration: planets_tables
-- Emote Stars and Planets PRD v2, Part B (Planets). Meaningful journal entries
-- join one or two of 8 life-area planets (Venus, Earth, Mercury, Saturn,
-- Jupiter, Mars, Neptune, Uranus), scored by the AI on save.
--
-- planet_assignments: which entries joined which planet(s), and why.
-- planet_state: one row per (user, planet) — the maintained aggregate the
--   Galaxy view reads to render size/visibility/mood without recomputing
--   from scratch on every page load.
-- planet_corrections: audit log when a user moves/removes an assignment.
-- goals.planet: optional user-chosen tag so a goal can show as a "moon"
--   around its relevant planet.
-- profiles.planet_notifications_enabled: Settings toggle for the in-app
--   "joined a planet" / "planet appeared" messages.

do $$ begin raise notice '>>> Running migration: 20261113000001_planets_tables'; end $$;

create table if not exists public.planet_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  planet text not null check (planet in ('venus', 'earth', 'mercury', 'saturn', 'jupiter', 'mars', 'neptune', 'uranus')),
  score numeric not null check (score between 0 and 1),
  is_primary boolean not null default false,
  source text not null default 'ai' check (source in ('ai', 'user')),
  created_at timestamptz not null default now(),
  unique (entry_id, planet)
);

comment on table public.planet_assignments is 'Which journal entries joined which planet(s). source=ai is the model''s own scoring; source=user is a manual correction (see planet_corrections for the audit trail).';

create index if not exists planet_assignments_user_idx on public.planet_assignments (user_id);
create index if not exists planet_assignments_entry_idx on public.planet_assignments (entry_id);

create table if not exists public.planet_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  planet text not null check (planet in ('venus', 'earth', 'mercury', 'saturn', 'jupiter', 'mars', 'neptune', 'uranus')),
  entry_count int not null default 0,
  size_stage smallint not null default 0 check (size_stage between 0 and 5),
  avg_mood numeric,
  last_entry_at timestamptz,
  visible boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, planet)
);

comment on table public.planet_state is 'One row per user per planet, maintained client-side after every entry save/edit/delete. visible flips true at 3 entries (PRD section 15) and never flips back.';

-- public.set_updated_at() already exists — created in 20260829000009_goals_table.sql.
drop trigger if exists tr_planet_state_updated_at on public.planet_state;
create trigger tr_planet_state_updated_at
  before update on public.planet_state
  for each row
  execute function public.set_updated_at();

create table if not exists public.planet_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id uuid references public.journal_entries (id) on delete set null,
  from_planet text check (from_planet in ('venus', 'earth', 'mercury', 'saturn', 'jupiter', 'mars', 'neptune', 'uranus')),
  to_planet text check (to_planet in ('venus', 'earth', 'mercury', 'saturn', 'jupiter', 'mars', 'neptune', 'uranus')),
  created_at timestamptz not null default now()
);

comment on table public.planet_corrections is 'Audit log only (not fed back into AI scoring yet). entry_id is set null on entry delete so history survives.';

create index if not exists planet_corrections_user_idx on public.planet_corrections (user_id);

alter table public.goals
  add column if not exists planet text check (planet is null or planet in ('venus', 'earth', 'mercury', 'saturn', 'jupiter', 'mars', 'neptune', 'uranus'));

comment on column public.goals.planet is 'Optional user-chosen planet this goal shows as a "moon" around. Null = not shown on any planet.';

alter table public.profiles
  add column if not exists planet_notifications_enabled boolean not null default true;

comment on column public.profiles.planet_notifications_enabled is 'In-app "joined a planet" / "planet appeared" messages. No server push exists yet — this only gates the in-app banner.';

alter table public.planet_assignments enable row level security;

drop policy if exists "planet_assignments_select_own" on public.planet_assignments;
create policy "planet_assignments_select_own"
  on public.planet_assignments for select
  using (auth.uid() = user_id);

drop policy if exists "planet_assignments_insert_own" on public.planet_assignments;
create policy "planet_assignments_insert_own"
  on public.planet_assignments for insert
  with check (auth.uid() = user_id);

drop policy if exists "planet_assignments_update_own" on public.planet_assignments;
create policy "planet_assignments_update_own"
  on public.planet_assignments for update
  using (auth.uid() = user_id);

drop policy if exists "planet_assignments_delete_own" on public.planet_assignments;
create policy "planet_assignments_delete_own"
  on public.planet_assignments for delete
  using (auth.uid() = user_id);

alter table public.planet_state enable row level security;

drop policy if exists "planet_state_select_own" on public.planet_state;
create policy "planet_state_select_own"
  on public.planet_state for select
  using (auth.uid() = user_id);

drop policy if exists "planet_state_insert_own" on public.planet_state;
create policy "planet_state_insert_own"
  on public.planet_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "planet_state_update_own" on public.planet_state;
create policy "planet_state_update_own"
  on public.planet_state for update
  using (auth.uid() = user_id);

drop policy if exists "planet_state_delete_own" on public.planet_state;
create policy "planet_state_delete_own"
  on public.planet_state for delete
  using (auth.uid() = user_id);

alter table public.planet_corrections enable row level security;

drop policy if exists "planet_corrections_select_own" on public.planet_corrections;
create policy "planet_corrections_select_own"
  on public.planet_corrections for select
  using (auth.uid() = user_id);

drop policy if exists "planet_corrections_insert_own" on public.planet_corrections;
create policy "planet_corrections_insert_own"
  on public.planet_corrections for insert
  with check (auth.uid() = user_id);

do $$ begin raise notice '<<< Completed migration: 20261113000001_planets_tables'; end $$;
