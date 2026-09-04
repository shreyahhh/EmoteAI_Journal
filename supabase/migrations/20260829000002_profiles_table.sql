-- Migration: profiles_table
-- One row per auth user, holding app-level profile fields collected during onboarding.

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
