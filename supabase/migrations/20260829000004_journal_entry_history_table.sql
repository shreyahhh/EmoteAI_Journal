-- Migration: journal_entry_history_table
-- Append-only audit log of every create/update/delete on journal_entries.
-- Populated exclusively by the SECURITY DEFINER trigger functions created
-- in 20260829000006_functions_and_triggers.sql.

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
