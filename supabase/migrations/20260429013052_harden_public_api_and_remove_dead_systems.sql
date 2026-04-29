-- Harden public API privileges and remove dead gamification/goal systems.
-- Runtime data access now goes through server route handlers with service_role,
-- except public approved news reads, which intentionally remain available.

drop table if exists public.user_achievements;
drop table if exists public.achievements;
drop table if exists public.user_goals;

revoke all privileges on all tables in schema public from anon;
revoke all privileges on all tables in schema public from authenticated;

grant select on table public.noticias to anon;

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from authenticated;

grant execute on function public.recalculate_user_statistics(uuid) to service_role;

create index if not exists idx_subscription_events_subscription_id
  on public.subscription_events (subscription_id);
