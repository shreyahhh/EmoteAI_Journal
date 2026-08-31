-- Migration: journal_entries_table
-- Current-state row per journal entry. Every write is additionally captured
-- in journal_entry_history by the triggers created in a later migration.

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
