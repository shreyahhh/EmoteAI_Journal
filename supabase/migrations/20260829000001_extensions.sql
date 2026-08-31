-- Migration: extensions
-- Enables the extensions the rest of the schema depends on.

create extension if not exists "pgcrypto";
