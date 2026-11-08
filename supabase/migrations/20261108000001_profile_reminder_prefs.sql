-- Migration: profile_reminder_prefs
-- Evening journaling reminder, picked during onboarding (ProfileSetupModal)
-- and editable later in Settings. Delivery is client-side only (Notification
-- API while a tab is open) — these columns are just the saved preference so
-- it follows the user across devices instead of living in localStorage.

do $$ begin raise notice '>>> Running migration: 20261108000001_profile_reminder_prefs'; end $$;

alter table public.profiles
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_time text not null default '21:00',
  add column if not exists reminder_days smallint[] not null default '{1,2,3,4,5}',
  add column if not exists cycle_reminders_enabled boolean not null default true;

comment on column public.profiles.reminder_time is 'HH:MM, 24h, in the user''s local time — evaluated client-side.';
comment on column public.profiles.reminder_days is '0=Sunday .. 6=Saturday.';
comment on column public.profiles.cycle_reminders_enabled is 'Whether to nudge for the daily cycle check-in during an expected period/PMS window (only relevant once cycle tracking is on).';

do $$ begin raise notice '<<< Completed migration: 20261108000001_profile_reminder_prefs'; end $$;
