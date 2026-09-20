-- Migration: journal_entries_replica_identity_full
-- Fixes a bug where deleting a journal entry never removes it from the UI
-- until the page is reloaded.
--
-- The Entries list (Dashboard.jsx) relies entirely on the journal_entries
-- Realtime subscription to update state — handleDeleteEntry does not
-- optimistically remove the row itself. Supabase Realtime evaluates each
-- table's RLS SELECT policy (`auth.uid() = user_id`) against the row before
-- deciding whether to broadcast a change to a given client. For a DELETE,
-- Postgres only includes the primary key in the write-ahead log by default
-- (REPLICA IDENTITY DEFAULT) — user_id isn't available, so the policy can't
-- be evaluated and the event is silently dropped. REPLICA IDENTITY FULL
-- includes the whole old row, so the DELETE event carries user_id and the
-- client actually receives it.
--
-- INSERT/UPDATE aren't affected (the full new row is always in the WAL),
-- which is why saving/editing an entry already reflected live.

do $$ begin raise notice '>>> Running migration: 20260920000001_journal_entries_replica_identity_full'; end $$;

alter table public.journal_entries replica identity full;

do $$ begin raise notice '<<< Completed migration: 20260920000001_journal_entries_replica_identity_full'; end $$;
