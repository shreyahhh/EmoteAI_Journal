-- Migration: llm_rate_limit
-- Per-user rate limit for the llm-proxy Edge Function, so one account can't use up the free
-- Groq / Gemini quota for everyone. Counters live in Postgres (not in the function's memory)
-- because Supabase runs several function instances. Only the service role can call it.

do $$ begin raise notice '>>> Running migration: 20261008000001_llm_rate_limit'; end $$;

create table if not exists public.llm_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null check (bucket in ('minute', 'day')),
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (user_id, bucket, window_start)
);

comment on table public.llm_usage is 'Request counters per user for llm-proxy rate limiting (per-minute and per-day windows, UTC). Written only by public.llm_rate_limit().';

alter table public.llm_usage enable row level security;  -- no policies: only the service role touches it

create or replace function public.llm_rate_limit(p_user uuid, p_per_min integer, p_per_day integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  minute_start timestamptz := date_trunc('minute', now());
  day_start timestamptz := date_trunc('day', now());
  m integer;
  d integer;
begin
  insert into public.llm_usage (user_id, bucket, window_start, hits)
  values (p_user, 'minute', minute_start, 1)
  on conflict (user_id, bucket, window_start) do update set hits = public.llm_usage.hits + 1
  returning hits into m;

  insert into public.llm_usage (user_id, bucket, window_start, hits)
  values (p_user, 'day', day_start, 1)
  on conflict (user_id, bucket, window_start) do update set hits = public.llm_usage.hits + 1
  returning hits into d;

  -- housekeeping: this user's old windows
  delete from public.llm_usage
  where user_id = p_user
    and ((bucket = 'minute' and window_start < minute_start - interval '5 minutes')
      or (bucket = 'day' and window_start < day_start - interval '2 days'));

  return jsonb_build_object(
    'allowed', (m <= p_per_min and d <= p_per_day),
    'minute', m,
    'day', d,
    'retry_after', case
      when d > p_per_day then ceil(extract(epoch from (day_start + interval '1 day' - now())))::integer
      when m > p_per_min then ceil(extract(epoch from (minute_start + interval '1 minute' - now())))::integer
      else 0
    end
  );
end;
$$;

revoke all on function public.llm_rate_limit(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.llm_rate_limit(uuid, integer, integer) to service_role;

do $$ begin raise notice '<<< Completed migration: 20261008000001_llm_rate_limit'; end $$;
