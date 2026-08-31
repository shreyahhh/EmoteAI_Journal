-- Migration: realtime_publication
-- Adds journal_entries and journal_entry_history to the supabase_realtime
-- publication so the dashboard can subscribe to live changes.
-- Guarded with a DO block so re-running this migration never errors with
-- "relation is already member of publication".

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'journal_entries'
  ) then
    alter publication supabase_realtime add table public.journal_entries;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'journal_entry_history'
  ) then
    alter publication supabase_realtime add table public.journal_entry_history;
  end if;
end;
$$;
