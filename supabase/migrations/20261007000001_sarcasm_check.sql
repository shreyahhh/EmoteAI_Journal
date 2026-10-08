-- Migration: sarcasm_check
-- 1) journal_entries.analysis: per-line results from the emotion/sarcasm model
--    (lines, sarcasm flags, and the user's answers keyed by normalised line text).
-- 2) sarcasm_feedback: one answer per (user, entry, line) to "did you mean that
--    sarcastically?". Kept in the user's own account; share_for_training is the
--    user's explicit opt-in (default false) for using the answer to retrain.

do $$ begin raise notice '>>> Running migration: 20261007000001_sarcasm_check'; end $$;

alter table public.journal_entries
  add column if not exists analysis jsonb;

comment on column public.journal_entries.analysis is 'Per-line model analysis: {v, source, lines[], sarcasm, answers{lineKey->sarcastic|sincere|skipped}, truncated, totalLines}. Null for entries analysed before this existed or by the Gemini fallback.';

create table if not exists public.sarcasm_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  line_key text not null,
  line_text text not null,
  model_probability real,
  user_label text not null check (user_label in ('sarcastic', 'sincere')),
  share_for_training boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_id, line_key)
);

comment on column public.sarcasm_feedback.line_key is 'Normalised line text (lowercase, alphanumerics and single spaces) so an answer survives edits elsewhere in the entry.';
comment on column public.sarcasm_feedback.share_for_training is 'User opted in to using this labelled line to retrain the sarcasm model. Default false.';

create index if not exists sarcasm_feedback_user_idx on public.sarcasm_feedback (user_id);

-- public.set_updated_at() already exists - created in 20260829000009_goals_table.sql.
drop trigger if exists tr_sarcasm_feedback_updated_at on public.sarcasm_feedback;
create trigger tr_sarcasm_feedback_updated_at
  before update on public.sarcasm_feedback
  for each row
  execute function public.set_updated_at();

alter table public.sarcasm_feedback enable row level security;

drop policy if exists "sarcasm_feedback_select_own" on public.sarcasm_feedback;
create policy "sarcasm_feedback_select_own"
  on public.sarcasm_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "sarcasm_feedback_insert_own" on public.sarcasm_feedback;
create policy "sarcasm_feedback_insert_own"
  on public.sarcasm_feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "sarcasm_feedback_update_own" on public.sarcasm_feedback;
create policy "sarcasm_feedback_update_own"
  on public.sarcasm_feedback for update
  using (auth.uid() = user_id);

drop policy if exists "sarcasm_feedback_delete_own" on public.sarcasm_feedback;
create policy "sarcasm_feedback_delete_own"
  on public.sarcasm_feedback for delete
  using (auth.uid() = user_id);

do $$ begin raise notice '<<< Completed migration: 20261007000001_sarcasm_check'; end $$;
