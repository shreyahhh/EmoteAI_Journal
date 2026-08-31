-- Migration: functions_and_triggers
-- 1. Keep journal_entries.updated_at current on every update.
-- 2. Mirror every journal_entries create/update/delete into journal_entry_history.
-- 3. Create a public.profiles row automatically when a new auth user signs up.

-- ---------------------------------------------------------------------------
-- set_journal_entries_updated_at: stamps updated_at on every UPDATE
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
-- journal_entry_history_after_write: logs 'create' and 'update' events
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
-- journal_entry_history_before_delete: logs a 'delete' snapshot
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
-- handle_new_user: auth.users insert -> public.profiles row
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
