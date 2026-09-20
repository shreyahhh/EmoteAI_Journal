-- Migration: extensions
-- Enables the extensions the rest of the schema depends on.

do $$ begin raise notice '>>> Running migration: 20260829000001_extensions'; end $$;

create extension if not exists "pgcrypto";

do $$ begin raise notice '<<< Completed migration: 20260829000001_extensions'; end $$;
